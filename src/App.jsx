import React from 'react'
import { SessionProvider } from './context/SessionContext'
import { ClaimProvider } from './context/ClaimContext'
import ClaimPage from './pages/ClaimPage'

export default function App() {
  return (
    <SessionProvider>
      <ClaimProvider>
        <ClaimPage />
      </ClaimProvider>
    </SessionProvider>
  )
}
