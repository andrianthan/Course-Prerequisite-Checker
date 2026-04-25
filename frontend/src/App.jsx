/**
 * App — root layout with full upload + course confirmation flow.
 *
 * State owned here:
 *   completed: {course_id: grade}    — editable by CourseList
 *   inProgress: [course_id]          — from transcript parse
 *   uploadLoading: bool
 *   uploadError: string|null
 *   hasTranscript: bool              — reveals Steps 2–4 after parse
 */
import React, { useState } from 'react'
import { BackendProvider, useBackend } from './context/BackendContext.jsx'
import { uploadTranscript } from './api.js'
import { UploadCard } from './components/UploadCard.jsx'
import { CourseList } from './components/CourseList.jsx'

function TopNav() {
  const { backend, toggleBackend } = useBackend()
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-indigo-600 font-bold text-lg tracking-tight">
          SJSU Prereq Checker
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 mr-1">Backend:</span>
          <button
            onClick={toggleBackend}
            className="flex rounded-full border border-gray-200 overflow-hidden text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            aria-label={`Switch to ${backend === 'oop' ? 'FP' : 'OOP'} backend`}
          >
            <span className={`px-4 py-1.5 transition-colors ${backend === 'oop' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              OOP
            </span>
            <span className={`px-4 py-1.5 transition-colors ${backend === 'fp' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              FP
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}

function SectionHeader({ step, title }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="flex-none w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
        {step}
      </span>
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    </div>
  )
}

function AppContent() {
  const [completed, setCompleted] = useState({})
  const [inProgress, setInProgress] = useState([])
  const [hasTranscript, setHasTranscript] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  async function handleUpload(file) {
    setUploadLoading(true)
    setUploadError(null)
    try {
      const record = await uploadTranscript(file)
      setCompleted(record.completed ?? {})
      setInProgress(record.in_progress ?? [])
      setHasTranscript(true)
    } catch (err) {
      setUploadError(err.message ?? 'Upload failed. Please try again.')
    } finally {
      setUploadLoading(false)
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Step 1 — Upload */}
      <section>
        <SectionHeader step="1" title="Upload your transcript" />
        <UploadCard
          onUpload={handleUpload}
          loading={uploadLoading}
          error={uploadError}
        />
      </section>

      {/* Step 2 — Confirm courses (revealed after parse) */}
      {hasTranscript && (
        <section>
          <SectionHeader step="2" title="Confirm your courses" />
          <CourseList courses={completed} onChange={setCompleted} />
          {inProgress.length > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              <span className="font-medium text-gray-700">In progress:</span>{' '}
              {inProgress.join(', ')}
            </p>
          )}
        </section>
      )}

      {/* Steps 3 + 4 placeholder — mounted by Plan 04 */}
      {hasTranscript && (
        <section id="steps-3-4-placeholder" data-completed={JSON.stringify(completed)} data-in-progress={JSON.stringify(inProgress)}>
          {/* CoursePicker, VerdictCard, and RecommendationsPanel mount here in Plan 04 */}
        </section>
      )}
    </main>
  )
}

export default function App() {
  return (
    <BackendProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <TopNav />
        <AppContent />
      </div>
    </BackendProvider>
  )
}
