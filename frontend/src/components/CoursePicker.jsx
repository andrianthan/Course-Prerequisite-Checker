/**
 * CoursePicker — searchable dropdown of all SJSU CS courses.
 * Calls onSelect(courseId) when user picks one.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { fetchCatalog } from '../api.js'

export default function CoursePicker({ value, onSelect }) {
  const [catalog, setCatalog] = useState([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchCatalog()
      .then(list => { if (!cancelled) setCatalog(list) })
      .catch(e => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return catalog.slice(0, 50)
    return catalog.filter(c =>
      c.course_id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 50)
  }, [query, catalog])

  const selected = catalog.find(c => c.course_id === value)

  return (
    <section className="space-y-2 relative">
      <h2 className="text-sm font-semibold text-gray-700">Step 3 — Pick a course</h2>
      <div className="relative">
        <input
          value={open ? query : (selected ? `${selected.course_id} — ${selected.name}` : query)}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="🔍 Search CS courses…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto z-30">
            {filtered.map(c => (
              <li
                key={c.course_id}
                onMouseDown={() => { onSelect(c.course_id); setQuery(''); setOpen(false) }}
                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm"
              >
                <span className="font-mono text-indigo-600 font-medium">{c.course_id}</span>
                <span className="text-gray-600 ml-2">{c.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && (
        <div className="text-xs text-red-600">Catalog load failed: {error}</div>
      )}
    </section>
  )
}
