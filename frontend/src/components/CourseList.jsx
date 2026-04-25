/**
 * CourseList — editable table of completed courses and grades.
 *
 * Props:
 *   courses: Record<string, string>   — {course_id: grade}, controlled
 *   onChange: (courses: Record<string, string>) => void — called on any edit
 */
import React, { useState } from 'react'

const GRADE_OPTIONS = [
  'A+','A','A-',
  'B+','B','B-',
  'C+','C','C-',
  'D+','D','D-',
  'F','W','I',
]

function GradeBadge({ grade }) {
  const isGood = ['A+','A','A-','B+','B','B-'].includes(grade)
  const isOk   = ['C+','C','C-'].includes(grade)
  const color  = isGood
    ? 'bg-green-100 text-green-800'
    : isOk
    ? 'bg-amber-100 text-amber-800'
    : 'bg-red-100 text-red-800'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {grade}
    </span>
  )
}

function CourseRow({ courseId, grade, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [editId, setEditId] = useState(courseId)
  const [editGrade, setEditGrade] = useState(grade)

  function save() {
    if (editId.trim()) {
      onUpdate(courseId, editId.trim().toUpperCase(), editGrade)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="bg-indigo-50">
        <td className="px-4 py-2">
          <input
            className="border border-indigo-300 rounded px-2 py-1 text-sm font-mono w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={editId}
            onChange={e => setEditId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            autoFocus
          />
        </td>
        <td className="px-4 py-2">
          <select
            className="border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={editGrade}
            onChange={e => setEditGrade(e.target.value)}
          >
            {GRADE_OPTIONS.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2 flex gap-2">
          <button
            onClick={save}
            className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
          >
            Cancel
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-gray-50 group">
      <td className="px-4 py-2 font-mono text-sm text-indigo-600 font-medium">
        {courseId}
      </td>
      <td className="px-4 py-2">
        <GradeBadge grade={grade} />
      </td>
      <td className="px-4 py-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => { setEditId(courseId); setEditGrade(grade); setEditing(true) }}
          className="text-gray-400 hover:text-indigo-600"
          aria-label={`Edit ${courseId}`}
          title="Edit"
        >
          {/* Pencil icon */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(courseId)}
          className="text-gray-400 hover:text-red-500"
          aria-label={`Remove ${courseId}`}
          title="Remove"
        >
          {/* X icon */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </td>
    </tr>
  )
}

export function CourseList({ courses, onChange }) {
  const entries = Object.entries(courses).sort(([a], [b]) => a.localeCompare(b))

  function handleUpdate(oldId, newId, newGrade) {
    const next = { ...courses }
    if (oldId !== newId) delete next[oldId]
    next[newId] = newGrade
    onChange(next)
  }

  function handleDelete(courseId) {
    const next = { ...courses }
    delete next[courseId]
    onChange(next)
  }

  function handleAdd() {
    // Add a blank placeholder that the user edits immediately
    const placeholder = 'NEW'
    let id = placeholder
    let i = 1
    while (id in courses) { id = `${placeholder}${i++}` }
    onChange({ ...courses, [id]: 'B' })
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No courses found in transcript.{' '}
        <button onClick={handleAdd} className="text-indigo-600 underline">Add one manually.</button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Course
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Grade
            </th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map(([id, grade]) => (
            <CourseRow
              key={id}
              courseId={id}
              grade={grade}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="px-4 py-3">
              <button
                onClick={handleAdd}
                className="flex items-center gap-1.5 text-sm text-indigo-600 border border-dashed border-indigo-300 rounded-md px-3 py-1.5 hover:bg-indigo-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add course
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
