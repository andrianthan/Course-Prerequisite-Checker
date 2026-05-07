/**
 * CoursesPanel — two-tab panel: CS Courses (eligible/near-eligible) and GE Courses (by area).
 */
import React, { useEffect, useState } from 'react'
import { useBackend } from '../context/BackendContext.jsx'
import { fetchRecommendations, fetchGECourses } from '../api.js'

// ── CS tab ────────────────────────────────────────────────────────────────────

function CSCoursesTab({ record, onPick, onAddToPlan, planned = [] }) {
  const { backend } = useBackend()
  const [data, setData] = useState({ eligible: [], near_eligible: [] })
  const [tab, setTab] = useState('eligible')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!record) { setData({ eligible: [], near_eligible: [] }); return }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchRecommendations(record.completed, record.in_progress, backend)
      .then(d => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [record, backend])

  const plannedSet = new Set(planned)
  const list = (tab === 'eligible' ? data.eligible : data.near_eligible)
    .filter(item => tab !== 'eligible' || !plannedSet.has(item.course_id))

  return (
    <>
      <div className="flex bg-gray-100 rounded text-xs">
        <button
          onClick={() => setTab('eligible')}
          className={`px-3 py-1 rounded ${tab === 'eligible' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          Eligible <span className="opacity-80">({data.eligible.length})</span>
        </button>
        <button
          onClick={() => setTab('near')}
          className={`px-3 py-1 rounded ${tab === 'near' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          Near-eligible <span className="opacity-80">({data.near_eligible.length})</span>
        </button>
      </div>

      <div className="p-4 max-h-80 overflow-auto">
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">Error: {error}</p>}
        {!loading && !error && list.length === 0 && (
          <p className="text-sm text-gray-400">
            {tab === 'eligible' ? 'No courses currently eligible.' : 'No near-eligible courses.'}
          </p>
        )}
        {!loading && !error && list.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {list.map(item => (
              <li
                key={item.course_id}
                onClick={() => onPick(item.course_id)}
                className="py-2 px-1 cursor-pointer hover:bg-gray-50 rounded text-sm flex items-center gap-3"
              >
                <span className="font-mono text-indigo-600 font-semibold w-20">{item.course_id}</span>
                <span className="text-gray-700 flex-1 truncate">{item.name}</span>
                {tab === 'eligible' && onAddToPlan && (
                  <button
                    onClick={e => { e.stopPropagation(); onAddToPlan(item.course_id) }}
                    className="text-green-600 hover:text-green-800 ml-auto"
                    aria-label={`Add ${item.course_id} to semester plan`}
                    title="Add to semester plan"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
                {tab === 'near' && (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono">
                    {item.missing}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

// ── GE tab ────────────────────────────────────────────────────────────────────

const AREA_ORDER = ['A1','A2','A3','B1','B2','B4','C1','C2','D','E','F','R','S','V']

function GECoursesTab({ record, onAddToPlan, planned = [] }) {
  const [areas, setAreas] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchGECourses()
      .then(d => { if (!cancelled) setAreas(d) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading GE courses…</div>
  if (error) return <div className="p-4 text-sm text-red-600">Error: {error}</div>
  if (!areas) return null

  const completed = record?.completed ?? {}
  const completedSet = new Set(Object.keys(completed))

  const toggleArea = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const orderedAreas = [
    ...AREA_ORDER.filter(id => areas[id]),
    ...Object.keys(areas).filter(id => !AREA_ORDER.includes(id)),
  ]

  return (
    <div className="p-3 max-h-80 overflow-auto space-y-1">
      {orderedAreas.map(areaId => {
        const area = areas[areaId]
        const satisfiedCourse = area.courses.find(c => completedSet.has(c.id))
        const satisfied = !!satisfiedCourse
        const open = expanded[areaId]

        return (
          <div key={areaId} className={`rounded border ${satisfied ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
            <button
              onClick={() => toggleArea(areaId)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left"
            >
              <span className={`text-xs font-bold w-8 shrink-0 ${satisfied ? 'text-emerald-700' : 'text-indigo-600'}`}>
                {areaId}
              </span>
              <span className={`text-xs flex-1 ${satisfied ? 'text-emerald-800' : 'text-gray-700'}`}>
                {area.name}
              </span>
              {satisfied ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold shrink-0">
                  ✓ {satisfiedCourse.id}
                </span>
              ) : (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">
                  {area.units_required}u needed
                </span>
              )}
              <span className="text-gray-400 text-xs ml-1">{open ? '▴' : '▾'}</span>
            </button>

            {open && (
              <div className="border-t border-gray-100 px-3 py-2">
                <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide">
                  Courses that satisfy {areaId}
                </p>
                <ul className="space-y-0.5 max-h-32 overflow-auto">
                  {area.courses.map(c => {
                    const done = completedSet.has(c.id)
                    const inPlan = planned.includes(c.id)
                    return (
                      <li key={c.id} className={`flex items-center gap-2 text-xs py-0.5 ${done ? 'opacity-60' : ''}`}>
                        <span className="font-mono text-indigo-500 w-16 shrink-0">{c.id}</span>
                        <span className="text-gray-600 flex-1 truncate">{c.name}</span>
                        <span className="text-gray-400 shrink-0">{c.units}u</span>
                        {done && <span className="text-emerald-600 text-[10px]">✓</span>}
                        {!done && onAddToPlan && (
                          <button
                            onClick={() => onAddToPlan(c.id)}
                            disabled={inPlan}
                            className={`shrink-0 ${inPlan ? 'text-gray-300 cursor-default' : 'text-green-600 hover:text-green-800'}`}
                            title={inPlan ? 'Already in plan' : 'Add to semester plan'}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function RecommendationsPanel({ record, onPick, onAddToPlan, planned = [] }) {
  const [outerTab, setOuterTab] = useState('cs')

  if (!record) return null

  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <header className="border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-gray-700">Courses</h2>
        <div className="flex bg-gray-100 rounded text-xs ml-auto">
          <button
            onClick={() => setOuterTab('cs')}
            className={`px-3 py-1 rounded ${outerTab === 'cs' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            CS
          </button>
          <button
            onClick={() => setOuterTab('ge')}
            className={`px-3 py-1 rounded ${outerTab === 'ge' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            GE
          </button>
        </div>
      </header>

      {outerTab === 'cs' ? (
        <CSCoursesTab record={record} onPick={onPick} onAddToPlan={onAddToPlan} planned={planned} />
      ) : (
        <GECoursesTab record={record} onAddToPlan={onAddToPlan} planned={planned} />
      )}
    </section>
  )
}
