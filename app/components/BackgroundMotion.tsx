'use client'

import { useEffect } from 'react'

export default function BackgroundMotion() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (prefersReducedMotion.matches) return

    const root = document.documentElement
    let rafId = 0

    const updatePointer = (event: MouseEvent) => {
      const x = Math.min(Math.max(event.clientX / window.innerWidth, 0), 1)
      const y = Math.min(Math.max(event.clientY / window.innerHeight, 0), 1)
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        root.style.setProperty('--pointer-x', x.toFixed(3))
        root.style.setProperty('--pointer-y', y.toFixed(3))
      })
    }

    const resetPointer = () => {
      root.style.setProperty('--pointer-x', '0.5')
      root.style.setProperty('--pointer-y', '0.5')
    }

    window.addEventListener('mousemove', updatePointer)
    window.addEventListener('mouseleave', resetPointer)

    resetPointer()

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', updatePointer)
      window.removeEventListener('mouseleave', resetPointer)
    }
  }, [])

  return (
    <div className="bg-ornaments" aria-hidden="true">
      <div className="bg-orb bg-orb-left" />
      <div className="bg-orb bg-orb-right" />
      <div className="bg-orb bg-orb-banner" />
    </div>
  )
}
