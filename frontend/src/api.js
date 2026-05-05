/**
 * API helpers — all calls go to the FastAPI backend on :8000.
 *
 * All functions return the parsed JSON response or throw an Error
 * with a human-readable message on HTTP 4xx/5xx.
 */

const BASE_URL = 'http://localhost:8000'

async function _json(res) {
  const data = await res.json()
  if (!res.ok) {
    const detail = data?.detail
    const msg =
      data?.error ??
      (typeof detail === 'string' ? detail : detail?.error) ??
      `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data
}

/**
 * Fetch the full SJSU CS catalog.
 * Returns [{course_id: string, name: string}, ...]
 */
export async function fetchCatalog() {
  const res = await fetch(`${BASE_URL}/api/catalog`)
  return _json(res)
}

/**
 * Upload a transcript PDF and get parsed student record.
 * @param {File} file — PDF File object from <input type="file">
 * Returns {completed: {course_id: grade}, in_progress: [course_id]}
 */
export async function uploadTranscript(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE_URL}/api/transcript`, {
    method: 'POST',
    body: form,
  })
  return _json(res)
}

/**
 * Check eligibility for one course.
 * @param {string} courseId
 * @param {{[course_id: string]: string}} completed — {course_id: grade}
 * @param {string[]} inProgress
 * @param {'oop'|'fp'} backend
 * Returns {eligible: boolean, explanation: string}
 */
export async function checkEligibility(courseId, completed, inProgress, backend = 'oop') {
  const res = await fetch(`${BASE_URL}/api/check?backend=${backend}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      course_id: courseId,
      completed,
      in_progress: inProgress,
    }),
  })
  return _json(res)
}

/**
 * Fetch eligible + near-eligible course recommendations.
 * @param {{[course_id: string]: string}} completed
 * @param {string[]} inProgress
 * @param {'oop'|'fp'} backend
 * Returns {
 *   eligible: [{course_id, name}],
 *   near_eligible: [{course_id, name, missing}]
 * }
 */
export async function fetchRecommendations(completed, inProgress, backend = 'oop') {
  const res = await fetch(`${BASE_URL}/api/recommendations?backend=${backend}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed, in_progress: inProgress }),
  })
  return _json(res)
}

/**
 * Fetch graduation progress (total + CS units completed vs required).
 * Returns {units_completed, units_required, cs_units_completed, cs_units_required}
 */
export async function fetchProgress(completed) {
  const res = await fetch(`${BASE_URL}/api/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  })
  return _json(res)
}
