import React, { createContext, useContext, useEffect, useState } from 'react'
import i18n from '../i18n'
import mockSession from '../../mock/session.json'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Load from mock for dev; swap this with a real auth token lookup in prod.
    // session_id is unique per browser session — used by n8n for conversation memory.
    const loaded = { ...mockSession, session_id: crypto.randomUUID() }
    setSession(loaded)

    const lang = loaded.language || 'en'
    i18n.changeLanguage(lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [])

  function changeLanguage(lang) {
    setSession((prev) => ({ ...prev, language: lang }))
    i18n.changeLanguage(lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }

  if (!session) return null

  return (
    <SessionContext.Provider value={{ session, changeLanguage }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
