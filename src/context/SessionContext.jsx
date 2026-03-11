import React, { createContext, useContext, useEffect, useState } from 'react'
import i18n from '../i18n'
import mockSession from '../../mock/session.json'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null)

  useEffect(() => {
    const loaded = { ...mockSession, session_id: crypto.randomUUID() }
    setSession(loaded)
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
