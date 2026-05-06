"""FastAPI backend for Course Prerequisite Checker.

Endpoints:
  GET  /api/catalog                        — full SJSU CS course list
  POST /api/transcript                     — upload PDF, get parsed student record
  POST /api/check?backend=oop|fp           — eligibility verdict for one course
  POST /api/recommendations?backend=oop|fp — eligible + near-eligible lists

Error shape: {"error": "<message>"} with appropriate HTTP status.
CORS: allows http://localhost:5173 and http://localhost:3000.
"""

import os
import tempfile
import traceback
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

_ROOT = Path(__file__).parent.parent
_CATALOG_PATH = _ROOT / "data" / "sjsu_cs_catalog.json"
_GRAD_REQS_PATH = _ROOT / "data" / "grad_requirements.json"

_catalog_data: dict = {}
_oop_catalog: dict = {}
_fp_catalog: dict = {}
_grad_reqs: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load catalog JSON and build both OOP + FP catalogs once at startup."""
    global _catalog_data, _oop_catalog, _fp_catalog, _grad_reqs
    from src.shared.loader import load_catalog
    from src.oop.checker import build_catalog as oop_build_catalog
    from src.fp.checker import parse_catalog as fp_parse_catalog

    _catalog_data = load_catalog(str(_CATALOG_PATH))
    _oop_catalog = oop_build_catalog(_catalog_data)
    _fp_catalog = fp_parse_catalog(_catalog_data)
    import json
    with open(_GRAD_REQS_PATH) as f:
        _grad_reqs = json.load(f)
    yield


app = FastAPI(title="Course Prerequisite Checker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CheckRequest(BaseModel):
    course_id: str
    completed: dict[str, str]
    in_progress: list[str]


class CheckResponse(BaseModel):
    eligible: bool
    explanation: str


class RecommendRequest(BaseModel):
    completed: dict[str, str]
    in_progress: list[str]


class CourseRef(BaseModel):
    course_id: str
    name: str


class NearCourseRef(BaseModel):
    course_id: str
    name: str
    missing: str


class RecommendResponse(BaseModel):
    eligible: list[CourseRef]
    near_eligible: list[NearCourseRef]


class CareerCourseResult(BaseModel):
    course_id: str
    name: str
    career_reason: str
    status: str  # "eligible" | "near_eligible" | "not_yet"
    missing: str | None = None


class CareerRecommendResponse(BaseModel):
    goal_label: str
    goal_description: str
    courses: list[CareerCourseResult]


class ProgressRequest(BaseModel):
    completed: dict[str, str]


class ProgressResponse(BaseModel):
    units_completed: float
    units_required: int
    cs_units_completed: float
    cs_units_required: int


def _get_backend(backend: str):
    """Return (catalog, check_fn, mode) for the requested backend."""
    if backend == "fp":
        from src.fp.checker import check_eligibility as fp_check
        return _fp_catalog, fp_check, "fp"
    else:
        from src.oop.checker import check_eligibility as oop_check
        return _oop_catalog, oop_check, "oop"


def _course_name(catalog, course_id: str) -> str:
    obj = catalog.get(course_id)
    if obj is None:
        return course_id
    return getattr(obj, "name", course_id)


@app.get("/api/catalog")
def get_catalog():
    """Return list of all SJSU CS courses: [{course_id, name}, ...]."""
    if not _catalog_data:
        raise HTTPException(status_code=503, detail="Catalog not loaded")
    courses = _catalog_data.get("courses", {})
    return [
        {"course_id": cid, "name": info.get("name", cid), "units": info.get("units", 3)}
        for cid, info in sorted(courses.items())
    ]


@app.post("/api/progress", response_model=ProgressResponse)
def get_progress(body: ProgressRequest):
    """Return graduation unit progress for a student."""
    if not _catalog_data:
        raise HTTPException(status_code=503, detail="Catalog not loaded")
    courses = _catalog_data.get("courses", {})
    skip_grades = {"F", "W", "I"}
    units_completed = 0.0
    cs_units_completed = 0.0
    for course_id, grade in body.completed.items():
        if grade in skip_grades:
            continue
        course_info = courses.get(course_id, {})
        u = course_info.get("units", 3) if isinstance(course_info, dict) else 3
        units_completed += u
        if course_id.startswith("CS"):
            cs_units_completed += u
    return ProgressResponse(
        units_completed=units_completed,
        units_required=_grad_reqs.get("total_units_required", 120),
        cs_units_completed=cs_units_completed,
        cs_units_required=_grad_reqs.get("cs_major_units_required", 51),
    )


@app.post("/api/transcript")
async def upload_transcript(file: UploadFile = File(...)):
    """Accept a transcript PDF and return the parsed student record."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail={"error": "File must be a PDF"})

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        from src.api.transcript_parser import parse_transcript_pdf
        record = parse_transcript_pdf(tmp_path)
        return record
    except EnvironmentError as exc:
        raise HTTPException(status_code=503, detail={"error": str(exc)})
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={"error": str(exc)})
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={"error": f"Parsing failed: {exc}"})
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


@app.post("/api/check", response_model=CheckResponse)
def check_eligibility(
    body: CheckRequest,
    backend: Annotated[str, Query()] = "oop",
):
    """Return eligibility verdict for one course."""
    catalog, check_fn, mode = _get_backend(backend)

    course_obj = catalog.get(body.course_id)
    if course_obj is None:
        raise HTTPException(
            status_code=404,
            detail={"error": f"Course {body.course_id!r} not found in catalog"},
        )

    try:
        if mode == "fp":
            eligible, explanation = check_fn(
                course_obj, body.completed, tuple(body.in_progress)
            )
        else:
            eligible, explanation = check_fn(
                course_obj, body.completed, body.in_progress
            )
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={"error": str(exc)})

    return CheckResponse(eligible=eligible, explanation=explanation)


@app.post("/api/recommendations", response_model=RecommendResponse)
def get_recommendations(
    body: RecommendRequest,
    backend: Annotated[str, Query()] = "oop",
):
    """Return eligible + near-eligible courses for a student."""
    from src.shared.recommender import (
        get_eligible_courses,
        get_near_eligible_courses,
    )

    catalog, check_fn, mode = _get_backend(backend)

    in_progress = (
        tuple(body.in_progress) if mode == "fp" else body.in_progress
    )

    try:
        eligible_pairs = get_eligible_courses(
            catalog, body.completed, in_progress, check_fn
        )
        near_pairs = get_near_eligible_courses(
            catalog, body.completed, in_progress, check_fn
        )
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={"error": str(exc)})

    eligible_out = [
        CourseRef(course_id=cid, name=_course_name(catalog, cid))
        for cid, _ in eligible_pairs
    ]
    near_out = [
        NearCourseRef(
            course_id=cid,
            name=_course_name(catalog, cid),
            missing=missing,
        )
        for cid, _, missing in near_pairs
    ]

    return RecommendResponse(eligible=eligible_out, near_eligible=near_out)


@app.post("/api/career-recommendations", response_model=CareerRecommendResponse)
def get_career_recommendations(
    body: RecommendRequest,
    career_goal: Annotated[str, Query()] = "full_stack",
    backend: Annotated[str, Query()] = "oop",
):
    """Return goal-filtered course recommendations with eligibility status."""
    import json as _json
    goals_path = _ROOT / "data" / "career_goals.json"
    goals_data = _json.loads(goals_path.read_text())

    goal_info = goals_data["goals"].get(career_goal)
    if goal_info is None:
        raise HTTPException(status_code=404, detail={"error": f"Career goal {career_goal!r} not found"})

    catalog, check_fn, mode = _get_backend(backend)
    in_progress = tuple(body.in_progress) if mode == "fp" else body.in_progress

    _NOT_ELIGIBLE_PREFIX = "Not eligible: "

    results = []
    for course_id, career_reason in goal_info["courses"].items():
        course_obj = catalog.get(course_id)
        if course_obj is None:
            continue

        try:
            eligible, explanation = check_fn(course_obj, body.completed, in_progress)
        except Exception:
            continue

        if eligible:
            status = "eligible"
            missing = None
        else:
            missing = None
            status = "not_yet"
            if explanation.startswith(_NOT_ELIGIBLE_PREFIX):
                missing_part = explanation[len(_NOT_ELIGIBLE_PREFIX):]
                unmet = [item.strip() for item in missing_part.split(",") if item.strip()]
                if len(unmet) == 1:
                    status = "near_eligible"
                    missing = unmet[0]

        results.append(CareerCourseResult(
            course_id=course_id,
            name=_course_name(catalog, course_id),
            career_reason=career_reason,
            status=status,
            missing=missing,
        ))

    order = {"eligible": 0, "near_eligible": 1, "not_yet": 2}
    results.sort(key=lambda r: order[r.status])

    return CareerRecommendResponse(
        goal_label=goal_info["label"],
        goal_description=goal_info["description"],
        courses=results,
    )


@app.get("/api/career-goals")
def list_career_goals():
    """Return list of available career goals."""
    import json as _json
    goals_path = _ROOT / "data" / "career_goals.json"
    goals_data = _json.loads(goals_path.read_text())
    return [
        {"id": gid, "label": g["label"], "icon": g["icon"], "description": g["description"]}
        for gid, g in goals_data["goals"].items()
    ]
