"""Shared test suite — both OOP and FP implementations must pass these."""

import pytest
from src.shared.loader import load_json
from src.oop.checker import build_catalog as oop_build_catalog, check_eligibility as oop_check
from src.fp.checker import parse_catalog as fp_parse_catalog, check_eligibility as fp_check
from src.shared.errors import CycleError


CATALOG_PATH = "data/sample_catalog.json"


@pytest.fixture
def catalog_data():
    return load_json(CATALOG_PATH)


@pytest.fixture
def oop_catalog(catalog_data):
    return oop_build_catalog(catalog_data)


@pytest.fixture
def fp_catalog(catalog_data):
    return fp_parse_catalog(catalog_data)


class TestNoPrerequisites:
    """Course with no prerequisites — always eligible."""

    def test_oop(self, oop_catalog):
        eligible, _ = oop_check(oop_catalog["CS46A"], {}, [])
        assert eligible is True

    def test_fp(self, fp_catalog):
        eligible, _ = fp_check(fp_catalog["CS46A"], {}, ())
        assert eligible is True


class TestSimpleCourseRule:
    """Single course prerequisite."""

    def test_oop_eligible(self, oop_catalog):
        eligible, _ = oop_check(oop_catalog["CS46B"], {"CS46A": "B+"}, [])
        assert eligible is True

    def test_oop_not_eligible(self, oop_catalog):
        eligible, _ = oop_check(oop_catalog["CS46B"], {}, [])
        assert eligible is False

    def test_fp_eligible(self, fp_catalog):
        eligible, _ = fp_check(fp_catalog["CS46B"], {"CS46A": "B+"}, ())
        assert eligible is True

    def test_fp_not_eligible(self, fp_catalog):
        eligible, _ = fp_check(fp_catalog["CS46B"], {}, ())
        assert eligible is False


class TestAndRule:
    """AND rule — all requirements must be met."""

    def test_oop_all_met(self, oop_catalog):
        completed = {"CS46B": "B", "MATH42": "A"}
        eligible, _ = oop_check(oop_catalog["CS146"], completed, [])
        assert eligible is True

    def test_oop_partial(self, oop_catalog):
        completed = {"CS46B": "B"}
        eligible, _ = oop_check(oop_catalog["CS146"], completed, [])
        assert eligible is False

    def test_fp_all_met(self, fp_catalog):
        completed = {"CS46B": "B", "MATH42": "A"}
        eligible, _ = fp_check(fp_catalog["CS146"], completed, ())
        assert eligible is True

    def test_fp_partial(self, fp_catalog):
        completed = {"CS46B": "B"}
        eligible, _ = fp_check(fp_catalog["CS146"], completed, ())
        assert eligible is False


class TestOrRule:
    """OR rule — at least one requirement must be met."""

    def test_oop_first_met(self, oop_catalog):
        completed = {"CS146": "B", "CS151": "A"}
        eligible, _ = oop_check(oop_catalog["CS160"], completed, [])
        assert eligible is True

    def test_oop_second_met(self, oop_catalog):
        completed = {"CS146": "B", "CS152": "A"}
        eligible, _ = oop_check(oop_catalog["CS160"], completed, [])
        assert eligible is True

    def test_oop_none_met(self, oop_catalog):
        completed = {"CS146": "B"}
        eligible, _ = oop_check(oop_catalog["CS160"], completed, [])
        assert eligible is False

    def test_fp_first_met(self, fp_catalog):
        completed = {"CS146": "B", "CS151": "A"}
        eligible, _ = fp_check(fp_catalog["CS160"], completed, ())
        assert eligible is True

    def test_fp_second_met(self, fp_catalog):
        completed = {"CS146": "B", "CS152": "A"}
        eligible, _ = fp_check(fp_catalog["CS160"], completed, ())
        assert eligible is True

    def test_fp_none_met(self, fp_catalog):
        completed = {"CS146": "B"}
        eligible, _ = fp_check(fp_catalog["CS160"], completed, ())
        assert eligible is False


class TestMinGrade:
    """Min-grade enforcement (PAR-03).

    CS46B has prerequisite {course: CS46A, min_grade: C-}.
    Verify both backends correctly enforce the min_grade threshold.
    Verify default threshold (C-) is applied when min_grade is None.
    """

    def test_oop_below_threshold(self, oop_catalog):
        # CS46A earned with "D" — fails CS46B's C- min_grade
        eligible, _ = oop_check(oop_catalog["CS46B"], {"CS46A": "D"}, [])
        assert eligible is False

    def test_oop_at_threshold(self, oop_catalog):
        # CS46A earned with exactly "C-" — meets the threshold
        eligible, _ = oop_check(oop_catalog["CS46B"], {"CS46A": "C-"}, [])
        assert eligible is True

    def test_oop_above_threshold(self, oop_catalog):
        # CS46A earned with "B+" — comfortably above threshold
        eligible, _ = oop_check(oop_catalog["CS46B"], {"CS46A": "B+"}, [])
        assert eligible is True

    def test_oop_default_threshold_rejects_d(self, oop_catalog):
        # MATH42 has no prerequisites, but for default-threshold testing we
        # need a CourseRule with min_grade=None. Build a small inline catalog.
        from src.oop.checker import build_catalog as _build
        catalog = _build({
            "courses": {
                "FOO": {"name": "Foo", "prerequisites": None},
                "BAR": {
                    "name": "Bar",
                    "prerequisites": {"type": "course", "course_id": "FOO"},
                },
            }
        })
        eligible, _ = oop_check(catalog["BAR"], {"FOO": "D"}, [])
        assert eligible is False

    def test_fp_below_threshold(self, fp_catalog):
        eligible, _ = fp_check(fp_catalog["CS46B"], {"CS46A": "D"}, ())
        assert eligible is False

    def test_fp_at_threshold(self, fp_catalog):
        eligible, _ = fp_check(fp_catalog["CS46B"], {"CS46A": "C-"}, ())
        assert eligible is True

    def test_fp_above_threshold(self, fp_catalog):
        eligible, _ = fp_check(fp_catalog["CS46B"], {"CS46A": "B+"}, ())
        assert eligible is True

    def test_fp_default_threshold_rejects_d(self, fp_catalog):
        from src.fp.checker import parse_catalog as _parse
        catalog = _parse({
            "courses": {
                "FOO": {"name": "Foo", "prerequisites": None},
                "BAR": {
                    "name": "Bar",
                    "prerequisites": {"type": "course", "course_id": "FOO"},
                },
            }
        })
        eligible, _ = fp_check(catalog["BAR"], {"FOO": "D"}, ())
        assert eligible is False
