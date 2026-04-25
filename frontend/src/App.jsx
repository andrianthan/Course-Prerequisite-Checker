/**
 * App — root layout.
 *
 * Structure:
 *   <BackendProvider>
 *     <TopNav />              ← sticky, contains OOP/FP toggle
 *     <main>                  ← scrollable content area
 *       {feature components will be imported in Plans 03 + 04}
 *     </main>
 *   </BackendProvider>
 */
import React from 'react'
import { BackendProvider, useBackend } from './context/BackendContext.jsx'

function TopNav() {
  const { backend, toggleBackend } = useBackend()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-2">
          <span className="text-indigo-600 font-bold text-lg tracking-tight">
            SJSU Prereq Checker
          </span>
        </div>

        {/* OOP / FP toggle pill */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 mr-1">Backend:</span>
          <button
            onClick={toggleBackend}
            className={`
              flex rounded-full border border-gray-200 overflow-hidden text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
            `}
            aria-label={`Switch to ${backend === 'oop' ? 'FP' : 'OOP'} backend`}
          >
            <span
              className={`px-4 py-1.5 transition-colors ${
                backend === 'oop'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              OOP
            </span>
            <span
              className={`px-4 py-1.5 transition-colors ${
                backend === 'fp'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              FP
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BackendProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <TopNav />
        <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          {/* Feature sections mounted by Plans 03 + 04 go here */}
          <p className="text-gray-400 text-center text-sm">
            Upload your transcript to get started.
          </p>
        </main>
      </div>
    </BackendProvider>
  )
}
