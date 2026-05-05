/**
 * SemesterPlanCard — list of courses queued for next semester.
 *
 * Props:
 *   plan: string[]                        — list of course_ids
 *   catalog: {course_id, name, units}[]   — full catalog for name/unit lookup
 *   onRemove: (courseId: string) => void
 */
import React from 'react'

export default function SemesterPlanCard({ plan, catalog, onRemove }) {
  const catalogMap = Object.fromEntries(catalog.map(c => [c.course_id, c]))
  const totalUnits = plan.reduce((sum, id) => sum + (catalogMap[id]?.units ?? 3), 0)

  return (
    <section className="bg-white border border-indigo-200 rounded-lg shadow-sm">
      <header className="border-b border-indigo-100 px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-indigo-700">Next Semester Plan</h2>
        <span className="text-xs text-gray-500">{totalUnits} units</span>
      </header>
      <div className="p-4">
        {plan.length === 0 ? (
          <p className="text-sm text-gray-400">Click + on eligible courses to add them here.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {plan.map(id => {
              const info = catalogMap[id]
              return (
                <li key={id} className="py-2 flex items-center gap-3">
                  <span className="font-mono text-indigo-600 font-semibold w-20 text-sm">{id}</span>
                  <span className="text-gray-700 flex-1 truncate text-sm">{info?.name ?? ''}</span>
                  <span className="text-xs text-gray-400">{info?.units ?? 3}u</span>
                  <button
                    onClick={() => onRemove(id)}
                    className="text-gray-400 hover:text-red-500 ml-1"
                    aria-label={`Remove ${id} from plan`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
