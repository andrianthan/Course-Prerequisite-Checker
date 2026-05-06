/**
 * UploadCard — drag-and-drop PDF upload zone.
 *
 * Props:
 *   onUpload: (file: File) => void  — called when a PDF is selected/dropped
 *   loading: boolean                — shows spinner, disables interaction
 *   error: string|null             — shows red border + message below card
 */
import React, { useRef, useState } from 'react'

export function UploadCard({ onUpload, loading = false, error = null }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      // Let parent handle; pass a non-PDF anyway so parent can show error
    }
    onUpload(file)
  }

  function onInputChange(e) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset so same file can be re-uploaded
    e.target.value = ''
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function onDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  const borderColor = error
    ? 'border-red-400 bg-red-50'
    : dragging
    ? 'border-indigo-500 bg-indigo-50'
    : 'border-gray-300 bg-white hover:border-indigo-400'

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload transcript PDF"
        onClick={() => !loading && inputRef.current?.click()}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && !loading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          rounded-lg border-2 border-dashed p-10 text-center cursor-pointer
          transition-colors select-none
          ${borderColor}
          ${loading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            {/* Spinner */}
            <svg
              className="animate-spin h-8 w-8 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <p className="text-sm text-indigo-700 font-medium">Parsing transcript…</p>
            <p className="text-xs text-gray-400">This may take a few seconds</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {/* Document icon */}
            <svg
              className="h-10 w-10 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700">
              Drop PDF or{' '}
              <span className="text-indigo-600 underline underline-offset-2">click to select</span>
            </p>
            <p className="text-xs text-gray-400">SJSU unofficial transcript · Max 5 MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={onInputChange}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
