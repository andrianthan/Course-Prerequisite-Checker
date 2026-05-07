/**
 * ProgressCard — shows graduation unit progress bars.
 * Props: record ({ completed, in_progress } | null)
 */
import React, { useEffect, useState } from 'react'
import { fetchProgress } from '../api.js'

export default function ProgressCard({ record, transferAreas = [] }) {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const completedKey = record ? JSON.stringify(record.completed) + JSON.stringify(transferAreas) : 'null'

  useEffect(() => {
    if (!record || Object.keys(record.completed).length === 0) {
      setProgress(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchProgress(record.completed, transferAreas)
      .then(p => { if (!cancelled) setProgress(p) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [completedKey, transferAreas])

  if (!record || Object.keys(record.completed).length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-sm text-gray-400 text-center">
        Add courses to see graduation progress.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-sm text-gray-500">
        Loading progress…
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-sm p-6 text-sm text-red-700">
        Error loading progress: {error}
      </div>
    )
  }

  if (!progress) return null

  const totalPct = Math.min(100, Math.round((progress.units_completed / progress.units_required) * 100))
  const csPct = Math.min(100, Math.round((progress.cs_units_completed / progress.cs_units_required) * 100))
  const gePct = progress.ge_units_required
    ? Math.min(100, Math.round((progress.ge_units_completed / progress.ge_units_required) * 100))
    : 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h3 className="text-xs font-semibold uppercase text-gray-500 mb-4">Graduation Progress</h3>

      {/* Total units bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">Total Units</span>
          <span className="text-gray-500">
            {progress.units_completed} / {progress.units_required} units ({totalPct}%)
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all"
            style={{ width: `${totalPct}%` }}
          />
        </div>
      </div>

      {/* CS major units bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">CS Major</span>
          <span className="text-gray-500">
            {progress.cs_units_completed} / {progress.cs_units_required} units ({csPct}%)
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-emerald-500 h-2.5 rounded-full transition-all"
            style={{ width: `${csPct}%` }}
          />
        </div>
      </div>

      {/* GE overall bar */}
      {progress.ge_units_required > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">GE Requirements</span>
            <span className="text-gray-500">
              {progress.ge_units_completed} / {progress.ge_units_required} units ({gePct}%)
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-violet-500 h-2.5 rounded-full transition-all"
              style={{ width: `${gePct}%` }}
            />
          </div>
        </div>
      )}

      {/* GE Areas */}
      {progress.ge_areas && Object.keys(progress.ge_areas).length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">GE Requirements</h4>
          <div className="grid grid-cols-4 gap-1.5">
            {Object.entries(progress.ge_areas).map(([areaId, area]) => (
              <div
                key={areaId}
                title={`${area.name}: ${area.units_completed}/${area.units_required} units`}
                className={`rounded px-2 py-1.5 text-center text-xs font-medium ${
                  area.satisfied
                    ? 'bg-emerald-100 text-emerald-700'
                    : area.units_completed > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <div className="font-bold">{areaId}</div>
                <div className="text-[10px] mt-0.5 opacity-80">
                  {area.satisfied ? '✓ done' : `${area.units_completed}/${area.units_required}u`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
