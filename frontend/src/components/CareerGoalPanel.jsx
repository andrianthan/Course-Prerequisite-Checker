/**
 * CareerGoalPanel — career goal selector + filtered course recommendations.
 */
import React, { useEffect, useState } from 'react'
import { useBackend } from '../context/BackendContext.jsx'
import { fetchCareerGoals, fetchCareerRecommendations } from '../api.js'

const STATUS_STYLES = {
  eligible: {
    badge: 'bg-green-100 text-green-800 border border-green-200',
    label: 'Eligible now',
    dot: 'bg-green-500',
  },
  near_eligible: {
    badge: 'bg-amber-100 text-amber-800 border border-amber-200',
    label: 'Almost there',
    dot: 'bg-amber-400',
  },
  not_yet: {
    badge: 'bg-gray-100 text-gray-500 border border-gray-200',
    label: 'Need prereqs',
    dot: 'bg-gray-300',
  },
}

export default function CareerGoalPanel({ record, onPick, onAddToPlan, planned = [] }) {
  const { backend } = useBackend()
  const [goals, setGoals] = useState([])
  const [selectedGoal, setSelectedGoal] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCareerGoals().then(g => {
      setGoals(g)
      if (g.length > 0) setSelectedGoal(g[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!record || !selectedGoal) {
      setData(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchCareerRecommendations(record.completed, record.in_progress, selectedGoal, backend)
      .then(d => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [record, selectedGoal, backend])

  if (!record) return null

  const plannedSet = new Set(planned)
  const selectedGoalInfo = goals.find(g => g.id === selectedGoal)

  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <header className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Career Goal Planner</h2>
        <div className="flex flex-wrap gap-2">
          {goals.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGoal(g.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedGoal === g.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              <span>{g.icon}</span>
              <span>{g.label}</span>
            </button>
          ))}
        </div>
        {selectedGoalInfo && (
          <p className="text-xs text-gray-500 mt-2">{selectedGoalInfo.description}</p>
        )}
      </header>

      <div className="p-4">
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">Error: {error}</p>}

        {!loading && !error && data && (
          <>
            <div className="flex gap-3 mb-3 text-xs text-gray-500">
              {['eligible', 'near_eligible', 'not_yet'].map(s => (
                <span key={s} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${STATUS_STYLES[s].dot}`} />
                  {STATUS_STYLES[s].label}: {data.courses.filter(c => c.status === s).length}
                </span>
              ))}
            </div>

            <ul className="divide-y divide-gray-100">
              {data.courses.map(course => {
                const style = STATUS_STYLES[course.status]
                const inPlan = plannedSet.has(course.course_id)
                return (
                  <li
                    key={course.course_id}
                    className="py-2.5 px-1 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => onPick(course.course_id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-none ${style.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-indigo-600 font-semibold text-sm">{course.course_id}</span>
                          <span className="text-gray-700 text-sm truncate">{course.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${style.badge}`}>
                            {style.label}
                          </span>
                          {course.status === 'eligible' && onAddToPlan && !inPlan && (
                            <button
                              onClick={e => { e.stopPropagation(); onAddToPlan(course.course_id) }}
                              className="text-green-600 hover:text-green-800"
                              title="Add to semester plan"
                              aria-label={`Add ${course.course_id} to plan`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{course.career_reason}</p>
                        {course.status === 'near_eligible' && course.missing && (
                          <p className="text-xs text-amber-700 mt-0.5 font-mono">Missing: {course.missing}</p>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
