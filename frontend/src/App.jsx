/**
 * App — root layout for the Course Prerequisite Checker demo.
 *
 *   <BackendProvider>
 *     <TopNav />            — sticky, OOP/FP toggle
 *     <main>
 *       Step 1: UploadCard (or skip + manual entry)
 *       Step 2: CourseList (completed) + in-progress chips
 *       Step 3: CoursePicker → VerdictCard + RecommendationsPanel
 *     </main>
 *   </BackendProvider>
 */
import React, { useState } from 'react'
import { BackendProvider, useBackend } from './context/BackendContext.jsx'
import { uploadTranscript } from './api.js'
import { UploadCard } from './components/UploadCard.jsx'
import { CourseList } from './components/CourseList.jsx'
import CoursePicker from './components/CoursePicker.jsx'
import VerdictCard from './components/VerdictCard.jsx'
import RecommendationsPanel from './components/RecommendationsPanel.jsx'

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
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [newInProgressId, setNewInProgressId] = useState('')

  async function handleUpload(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('File must be a PDF.')
      return
    }
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

  function startEmpty() {
    setCompleted({})
    setInProgress([])
    setHasTranscript(true)
  }

  function addInProgress() {
    const id = newInProgressId.trim().toUpperCase()
    if (!id || inProgress.includes(id)) return
    setInProgress(prev => [...prev, id])
    setNewInProgressId('')
  }

  function removeInProgress(id) {
    setInProgress(prev => prev.filter(c => c !== id))
  }

  // Compose record shape for downstream components
  const record = hasTranscript ? { completed, in_progress: inProgress } : null

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
        {!hasTranscript && !uploadLoading && (
          <button
            onClick={startEmpty}
            className="text-xs text-gray-500 hover:text-indigo-600 underline mt-2"
          >
            or skip upload and enter courses manually
          </button>
        )}
      </section>

      {/* Step 2 — Confirm courses */}
      {hasTranscript && (
        <section>
          <SectionHeader step="2" title="Confirm your courses" />
          <CourseList courses={completed} onChange={setCompleted} />

          <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">In progress</h3>
            {inProgress.length === 0 ? (
              <p className="text-sm text-gray-400 mb-2">None.</p>
            ) : (
              <ul className="flex flex-wrap gap-2 mb-2">
                {inProgress.map(cid => (
                  <li
                    key={cid}
                    className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-sm font-mono"
                  >
                    {cid}
                    <button
                      onClick={() => removeInProgress(cid)}
                      className="text-amber-500 hover:text-red-500 text-xs"
                      aria-label={`Remove ${cid}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                value={newInProgressId}
                onChange={e => setNewInProgressId(e.target.value)}
                placeholder="CS146"
                className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm font-mono"
                onKeyDown={e => e.key === 'Enter' && addInProgress()}
              />
              <button
                onClick={addInProgress}
                className="bg-gray-600 text-white text-sm px-3 py-1 rounded hover:bg-gray-700"
              >
                + Add
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Step 3 — Pick + verdict + recommendations */}
      {hasTranscript && (
        <section>
          <SectionHeader step="3" title="Pick a course" />
          <CoursePicker value={selectedCourseId} onSelect={setSelectedCourseId} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <VerdictCard courseId={selectedCourseId} record={record} />
            <RecommendationsPanel record={record} onPick={setSelectedCourseId} />
          </div>
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
