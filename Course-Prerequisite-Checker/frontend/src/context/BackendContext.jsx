/**
 * BackendContext — provides OOP/FP toggle state to the entire app.
 *
 * Usage:
 *   const { backend, toggleBackend } = useBackend();
 *   backend is 'oop' | 'fp'
 */
import React, { createContext, useContext, useState } from 'react'

const BackendContext = createContext(null)

export function BackendProvider({ children }) {
  const [backend, setBackend] = useState('oop')

  function toggleBackend() {
    setBackend(prev => (prev === 'oop' ? 'fp' : 'oop'))
  }

  return (
    <BackendContext.Provider value={{ backend, toggleBackend }}>
      {children}
    </BackendContext.Provider>
  )
}

export function useBackend() {
  const ctx = useContext(BackendContext)
  if (!ctx) throw new Error('useBackend must be used inside <BackendProvider>')
  return ctx
}
