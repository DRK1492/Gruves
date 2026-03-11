'use client'

import dynamic from 'next/dynamic'
import AppHeader from './AppHeader'
import AuthGate from './AuthGate'
import { SessionProvider } from './SessionProvider'
import { ThemeProvider } from './ThemeProvider'
import { ToastProvider } from './ToastProvider'

const BackgroundGeometry = dynamic(() => import('./BackgroundGeometry'), {
  ssr: false,
})

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackgroundGeometry intensity={3.2} density={1.8} />
      <ThemeProvider>
        <SessionProvider>
          <ToastProvider>
            <AppHeader />
            <AuthGate>{children}</AuthGate>
          </ToastProvider>
        </SessionProvider>
      </ThemeProvider>
    </>
  )
}
