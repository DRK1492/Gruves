'use client'

import { useEffect, useRef } from 'react'

interface BackgroundGeometryProps {
  intensity?: number
  accentBias?: number
  density?: number
  sideFocusWidth?: number
  speed?: number
  enabled?: boolean
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export default function BackgroundGeometry({
  intensity = 1.2,
  accentBias = 0.55,
  density = 1.1,
  sideFocusWidth = 0.24,
  speed = 0.7,
  enabled = true
}: BackgroundGeometryProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const pointerRef = useRef({ x: 0.5, y: 0.5, vx: 0, vy: 0 })
  const lastPointerRef = useRef({ x: 0.5, y: 0.5 })
  const lastMoveRef = useRef<number>(performance.now())
  const prefersReducedMotion = useRef(false)
  const shimmerRef = useRef(0)
  const trailRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; t: number }>>([])
  const lastTrailPushRef = useRef(0)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.current = media.matches
    const handleChange = () => {
      prefersReducedMotion.current = media.matches
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const state = {
      width: 0,
      height: 0,
      dpr: 1,
      start: performance.now(),
      elements: [] as Array<{
        x: number
        y: number
        r: number
        kind: 'circle' | 'arc'
        phase: number
        drift: number
        layer: number
      }>,
      ribbons: [] as Array<{
        x: number
        y: number
        amplitude: number
        frequency: number
        phase: number
        layer: number
        side: 'left' | 'right'
      }>
    }

    const resize = () => {
      state.dpr = window.devicePixelRatio || 1
      state.width = window.innerWidth
      state.height = window.innerHeight
      canvas.width = state.width * state.dpr
      canvas.height = state.height * state.dpr
      canvas.style.width = `${state.width}px`
      canvas.style.height = `${state.height}px`
      context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0)
      buildElements()
    }

    const buildElements = () => {
      const count = Math.floor(70 + density * 70)
      state.elements = []
      state.ribbons = []
      const leftWidth = state.width * sideFocusWidth
      const rightStart = state.width * (1 - sideFocusWidth)
      for (let i = 0; i < count; i += 1) {
        const side = i % 2 === 0
        const x = side
          ? Math.random() * leftWidth
          : rightStart + Math.random() * (state.width - rightStart)
        const y = Math.random() * state.height
        const r = 30 + Math.random() * 160
        const kind: 'circle' | 'arc' = i % 3 === 0 ? 'circle' : 'arc'
        state.elements.push({
          x,
          y,
          r,
          kind,
          phase: Math.random() * Math.PI * 2,
          drift: 0.35 + Math.random() * 0.85,
          layer: i % 4
        })
      }

      const ribbonCount = Math.floor(4 + density * 4)
      for (let i = 0; i < ribbonCount; i += 1) {
        const side = i % 2 === 0 ? 'left' : 'right'
        const x = side === 'left'
          ? Math.random() * leftWidth
          : rightStart + Math.random() * (state.width - rightStart)
        state.ribbons.push({
          x,
          y: Math.random() * state.height,
          amplitude: 16 + Math.random() * 44,
          frequency: 0.8 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2,
          layer: i % 3,
          side
        })
      }
    }

    const onMove = (event: MouseEvent) => {
      const x = clamp(event.clientX / window.innerWidth, 0, 1)
      const y = clamp(event.clientY / window.innerHeight, 0, 1)
      const now = performance.now()
      const dt = Math.max(now - lastMoveRef.current, 16)
      const vx = (x - lastPointerRef.current.x) / dt
      const vy = (y - lastPointerRef.current.y) / dt
      const velocity = Math.abs(vx) + Math.abs(vy)
      shimmerRef.current = clamp(shimmerRef.current + velocity * 360, 0, 3)
      pointerRef.current = {
        x,
        y,
        vx: clamp(vx, -0.01, 0.01),
        vy: clamp(vy, -0.01, 0.01)
      }
      if (now - lastTrailPushRef.current > 18) {
        trailRef.current.push({ x, y, vx, vy, t: now })
        lastTrailPushRef.current = now
      }
      const cutoff = now - 10000
      while (trailRef.current.length && trailRef.current[0].t < cutoff) {
        trailRef.current.shift()
      }
      lastPointerRef.current = { x, y }
      lastMoveRef.current = now
    }

    const onLeave = () => {
      pointerRef.current = { x: 0.5, y: 0.5, vx: 0, vy: 0 }
      lastPointerRef.current = { x: 0.5, y: 0.5 }
    }

    const drawCircle = (x: number, y: number, r: number, t: number, opacity: number) => {
      context.save()
      context.translate(x, y)
      context.rotate(t * 0.15)
      context.globalAlpha = opacity
      context.beginPath()
      context.arc(0, 0, r, 0, Math.PI * 2)
      context.stroke()
      context.beginPath()
      context.arc(0, 0, r * 0.74, Math.PI * 0.15, Math.PI * 1.7)
      context.stroke()
      context.beginPath()
      context.arc(0, 0, r * 0.6, Math.PI * 0.2, Math.PI * 1.6)
      context.stroke()
      for (let i = 0; i < 6; i += 1) {
        const angle = t * 0.25 + (Math.PI * 2 * i) / 6
        context.beginPath()
        context.moveTo(Math.cos(angle) * r * 0.2, Math.sin(angle) * r * 0.2)
        context.lineTo(Math.cos(angle) * r * 0.95, Math.sin(angle) * r * 0.95)
        context.stroke()
      }
      context.restore()
    }

    const drawArc = (x: number, y: number, r: number, t: number, opacity: number) => {
      context.save()
      context.translate(x, y)
      context.rotate(t * 0.25)
      context.globalAlpha = opacity
      context.beginPath()
      context.arc(0, 0, r, Math.PI * 0.1, Math.PI * 1.4)
      context.stroke()
      context.beginPath()
      context.arc(0, 0, r * 0.7, Math.PI * 1.1, Math.PI * 2)
      context.stroke()
      context.restore()
    }

    const drawRibbon = (ribbon: typeof state.ribbons[number], t: number, opacity: number) => {
      const { x, y, amplitude, frequency, phase, layer } = ribbon
      const width = state.width * sideFocusWidth
      const direction = ribbon.side === 'left' ? 1 : -1
      const maxX = width * 0.85
      const step = 18
      context.save()
      context.translate(x, y)
      context.rotate(t * 0.05 * (layer + 1) * direction)
      context.globalAlpha = opacity
      context.beginPath()
      for (let i = -maxX; i <= maxX; i += step) {
        const u = i / maxX
        const wobble = Math.sin(t * 0.4 + phase + u * frequency * Math.PI * 2)
        const twist = Math.cos(t * 0.2 + phase + u * 3.3)
        const yy = u * amplitude * 2 + wobble * amplitude * 0.9 + twist * amplitude * 0.35
        if (i === -maxX) context.moveTo(i, yy)
        else context.lineTo(i, yy)
      }
      context.stroke()
      context.restore()
    }

    const drawTrail = (now: number) => {
      const trail = trailRef.current
      if (trail.length < 2) return
      const cutoff = now - 10000
      while (trail.length && trail[0].t < cutoff) {
        trail.shift()
      }
      context.save()
      context.globalCompositeOperation = 'lighter'
      context.lineWidth = 1.15
      context.lineCap = 'round'
      for (let i = 0; i < trail.length - 1; i += 1) {
        const a = trail[i]
        const b = trail[i + 1]
        const age = now - a.t
        const decay = Math.exp(-age / 3600)
        const speed = Math.min(Math.abs(a.vx) + Math.abs(a.vy), 0.06)
        const alpha = clamp((0.08 + speed * 2.2) * decay, 0.02, 0.28)
        context.strokeStyle = `rgba(245, 185, 66, ${alpha.toFixed(3)})`
        context.beginPath()
        context.moveTo(a.x * state.width, a.y * state.height)
        context.lineTo(b.x * state.width, b.y * state.height)
        context.stroke()
      }

      for (let i = 0; i < trail.length; i += 6) {
        const p = trail[i]
        const age = now - p.t
        const decay = Math.exp(-age / 4200)
        const ripple = age * 0.06
        const alpha = clamp(0.06 * decay, 0.01, 0.12)
        context.strokeStyle = `rgba(230, 234, 240, ${alpha.toFixed(3)})`
        context.beginPath()
        context.arc(p.x * state.width, p.y * state.height, ripple, 0, Math.PI * 2)
        context.stroke()
      }
      context.restore()
    }

    const draw = () => {
      const now = performance.now()
      const t = ((now - state.start) / 1000) * speed
      context.clearRect(0, 0, state.width, state.height)

      const pointer = pointerRef.current
      const parallaxX = (pointer.x - 0.5) * 12
      const parallaxY = (pointer.y - 0.5) * 10
      const turbulence = (Math.abs(pointer.vx) + Math.abs(pointer.vy)) * 1.6
      shimmerRef.current = shimmerRef.current * 0.97 + turbulence * 6
      const shimmer = shimmerRef.current

      context.lineWidth = 1.1 + shimmer * 0.08
      context.lineCap = 'round'

      state.elements.forEach(item => {
        const layerFactor = 0.35 + item.layer * 0.2
        const offsetX = parallaxX * layerFactor + Math.sin(t * item.drift + item.phase) * 8
        const offsetY = parallaxY * layerFactor + Math.cos(t * item.drift + item.phase) * 10
        const warp = turbulence * 240
        const x = item.x + offsetX + Math.sin(t * 0.7 + item.phase) * warp
        const y = item.y + offsetY + Math.cos(t * 0.55 + item.phase) * warp

        const pointerX = pointer.x * state.width
        const pointerY = pointer.y * state.height
        const sideDistance = Math.min(item.x, state.width - item.x)
        const sideFocus = clamp(1 - sideDistance / (state.width * sideFocusWidth), 0, 1)
        const dx = (x - pointerX) * 0.006 * sideFocus
        const dy = (y - pointerY) * 0.006 * sideFocus

        let ripple = 0
        const trail = trailRef.current
        for (let i = Math.max(0, trail.length - 18); i < trail.length; i += 1) {
          const point = trail[i]
          const age = now - point.t
          const decay = Math.exp(-age / 3200)
          const px = point.x * state.width
          const py = point.y * state.height
          const dist = Math.hypot(x - px, y - py)
          ripple += Math.sin(age * 0.004 - dist * 0.03) * decay * 0.8
        }

        const lensX = x + dx * (8 + turbulence * 90) + ripple * 6
        const lensY = y + dy * (8 + turbulence * 90) + ripple * 6

        const accentMix = item.phase % 1 < accentBias
        const baseAlpha = (0.1 + item.layer * 0.04) * intensity
        context.strokeStyle = accentMix
          ? `rgba(245, 185, 66, ${baseAlpha.toFixed(3)})`
          : `rgba(230, 234, 240, ${(baseAlpha * 0.7).toFixed(3)})`

        const pulse = 0.6 + Math.sin(t * 0.45 + item.phase + shimmer) * 0.2
        const opacity = clamp(baseAlpha * (pulse + shimmer * 0.08), 0.04, 0.32)
        const size = item.r * (0.86 + Math.sin(t * 0.22 + item.phase) * 0.1)

        if (item.kind === 'circle') drawCircle(lensX, lensY, size * 0.6, t, opacity)
        if (item.kind === 'arc') drawArc(lensX, lensY, size * 0.6, t, opacity)
      })

      state.ribbons.forEach(ribbon => {
        const accentMix = ribbon.phase % 1 < accentBias
        const baseAlpha = (0.08 + ribbon.layer * 0.04) * intensity
        context.strokeStyle = accentMix
          ? `rgba(245, 185, 66, ${baseAlpha.toFixed(3)})`
          : `rgba(160, 167, 180, ${(baseAlpha * 0.75).toFixed(3)})`
        drawRibbon(ribbon, t, clamp(baseAlpha + shimmer * 0.06, 0.04, 0.3))
      })

      drawTrail(now)

      const mask = context.createLinearGradient(0, 0, state.width, 0)
      mask.addColorStop(0, 'rgba(0, 0, 0, 1)')
      mask.addColorStop(sideFocusWidth, 'rgba(0, 0, 0, 0.88)')
      mask.addColorStop(0.5, 'rgba(0, 0, 0, 0.55)')
      mask.addColorStop(1 - sideFocusWidth, 'rgba(0, 0, 0, 0.88)')
      mask.addColorStop(1, 'rgba(0, 0, 0, 1)')

      context.save()
      context.globalCompositeOperation = 'destination-in'
      context.fillStyle = mask
      context.fillRect(0, 0, state.width, state.height)
      context.restore()

      const vignette = context.createRadialGradient(
        state.width / 2,
        state.height / 2,
        state.width * 0.2,
        state.width / 2,
        state.height / 2,
        state.width * 0.7
      )
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0.85)')
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.3)')

      context.save()
      context.globalCompositeOperation = 'destination-in'
      context.fillStyle = vignette
      context.fillRect(0, 0, state.width, state.height)
      context.restore()

      if (!prefersReducedMotion.current) {
        rafRef.current = requestAnimationFrame(draw)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)

    if (prefersReducedMotion.current) {
      draw()
    } else {
      rafRef.current = requestAnimationFrame(draw)
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [accentBias, density, enabled, intensity, sideFocusWidth, speed])

  return <canvas ref={canvasRef} className="bg-geometry" aria-hidden="true" />
}
