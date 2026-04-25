/**
 * RecommendationsPanel — eligible + near-eligible course tabs.
 * Re-fetches when record or backend changes. Click an item to send to picker.
 */
import React, { useEffect, useState } from 'react'
import { useBackend } from '../context/BackendContext.jsx'
import { fetchRecommendations } from '../api.js'

export default function RecommendationsPanel({ record, onPick }) {
  const { backend } = useBackend()
  const [data, setData] = useState({ eligible: [], near_eligible: [] })
  const [tab, setTab] = useState('eligible')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!record) {
      setData({ eligible: [], near_eligible: [] })
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchRecommendations(record.completed, record.in_progress, backend)
      .then(d => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [record, backend])

  if (!record) return null

  const list = tab === 'eligible' ? data.eligible : data.near_eligible

  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <header className="border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-gray-700">Recommendations</h2>
        <div className="flex bg-gray-100 rounded text-xs ml-auto">
          <button
            onClick={() => setTab('eligible')}
            className={`px-3 py-1 rounded ${
              tab === 'eligible' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Eligible <span className="opacity-80">({data.eligible.length})</span>
          </button>
          <button
            onClick={() => setTab('near')}
            className={`px-3 py-1 rounded ${
              tab === 'near' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Near-eligible <span className="opacity-80">({data.near_eligible.length})</span>
          </button>
        </div>
      </header>

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
    </section>
  )
}
