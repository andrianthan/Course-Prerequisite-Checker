/**
 * VerdictCard — shows eligibility verdict + explanation for a target course.
 * Re-fires API call when courseId, record, or backend changes.
 */
import React, { useEffect, useState } from 'react'
import { useBackend } from '../context/BackendContext.jsx'
import { checkEligibility } from '../api.js'

export default function VerdictCard({ courseId, record }) {
  const { backend } = useBackend()
  const [verdict, setVerdict] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!courseId || !record) {
      setVerdict(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    checkEligibility(courseId, record.completed, record.in_progress, backend)
      .then(v => { if (!cancelled) setVerdict(v) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [courseId, record, backend])

  if (!courseId) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-400 text-center">
        Pick a course to see if you're eligible.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-500">
        Checking eligibility…
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-sm text-red-700">
        Error: {error}
      </div>
    )
  }

  if (!verdict) return null

  const ok = verdict.eligible
  return (
    <div
      className={`rounded-lg p-6 border shadow-sm ${
        ok
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <div className={`text-xs font-bold uppercase tracking-wide ${
        ok ? 'text-green-700' : 'text-red-700'
      }`}>
        {ok ? '✓ Eligible' : '✗ Not eligible'}
      </div>
      <div className="mt-1 font-mono text-lg font-semibold text-gray-900">{courseId}</div>
      <div className={`mt-2 text-sm leading-relaxed ${
        ok ? 'text-green-900' : 'text-red-900'
      }`}>
        {verdict.explanation}
      </div>
      <div className="mt-3 text-xs text-gray-500">
        Backend: <span className="font-mono">{backend.toUpperCase()}</span>
      </div>
    </div>
  )
}
