'use client'

import { useEffect, useRef } from 'react'

interface BackgroundGeometryProps {
  intensity?: number
  density?: number
  sideFocusWidth?: number
  enabled?: boolean
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const hexToRgb = (value: string) => {
  const hex = value.replace('#', '').trim()
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16)
    const g = parseInt(hex[1] + hex[1], 16)
    const b = parseInt(hex[2] + hex[2], 16)
    return `${r}, ${g}, ${b}`
  }
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `${r}, ${g}, ${b}`
  }
  return null
}

export default function BackgroundGeometry({
  intensity = 1,
  density = 1,
  sideFocusWidth = 0.2,
  enabled = true
}: BackgroundGeometryProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const prefersReducedMotion = useRef(false)
  const pointerRef = useRef({ x: 0.5, y: 0.5, vx: 0, vy: 0 })
  const lastPointerRef = useRef({ x: 0.5, y: 0.5 })
  const lastMoveRef = useRef<number>(performance.now())
  const rippleRef = useRef<Array<{ x: number; y: number; t: number; v: number }>>([])
  const lastRipplePushRef = useRef(0)
  const colorsRef = useRef({ accent: '245, 185, 66', text: '230, 234, 240' })

  useEffect(() => {
    const updateColors = () => {
      const styles = getComputedStyle(document.documentElement)
      const accentValue = styles.getPropertyValue('--accent')
      const textValue = styles.getPropertyValue('--text')
      const accent = hexToRgb(accentValue) ?? colorsRef.current.accent
      const text = hexToRgb(textValue) ?? colorsRef.current.text
      colorsRef.current = { accent, text }
    }
    updateColors()
    window.addEventListener('gt-theme-change', updateColors)
    return () => window.removeEventListener('gt-theme-change', updateColors)
  }, [])

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
      grid: [] as Array<{ x: number; y: number; ix: number; iy: number }>
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
      buildGrid()
    }

    const buildGrid = () => {
      const spacing = Math.max(82, 104 - density * 10)
      const cols = Math.ceil(state.width / spacing) + 2
      const rows = Math.ceil(state.height / spacing) + 2
      state.grid = []
      for (let y = -1; y < rows; y += 1) {
        for (let x = -1; x < cols; x += 1) {
          state.grid.push({
            x: x * spacing,
            y: y * spacing,
            ix: x,
            iy: y
          })
        }
      }
    }

    const onMove = (event: MouseEvent) => {
      const x = clamp(event.clientX / window.innerWidth, 0, 1)
      const y = clamp(event.clientY / window.innerHeight, 0, 1)
      const now = performance.now()
      const dt = Math.max(now - lastMoveRef.current, 16)
      const vx = (x - lastPointerRef.current.x) / dt
      const vy = (y - lastPointerRef.current.y) / dt
      pointerRef.current = {
        x,
        y,
        vx: clamp(vx, -0.01, 0.01),
        vy: clamp(vy, -0.01, 0.01)
      }
      if (now - lastRipplePushRef.current > 24) {
        const speed = Math.min(Math.abs(vx) + Math.abs(vy), 0.06)
        rippleRef.current.push({ x, y, t: now, v: speed })
        lastRipplePushRef.current = now
      }
      const cutoff = now - 9000
      while (rippleRef.current.length && rippleRef.current[0].t < cutoff) {
        rippleRef.current.shift()
      }
      lastPointerRef.current = { x, y }
      lastMoveRef.current = now
    }

    const onLeave = () => {
      pointerRef.current = { x: 0.5, y: 0.5, vx: 0, vy: 0 }
      lastPointerRef.current = { x: 0.5, y: 0.5 }
    }

    const drawGrid = (now: number) => {
      const spacing = Math.max(82, 104 - density * 10)
      const cols = Math.ceil(state.width / spacing) + 2
      const rows = Math.ceil(state.height / spacing) + 2
      const pointer = pointerRef.current
      const px = pointer.x * state.width
      const py = pointer.y * state.height
      const baseAlpha = 0.06 * intensity
      const shimmerAlpha = 0.11 * intensity

      const deformed: Array<Array<{ x: number; y: number }>> = []
      for (let row = 0; row < rows; row += 1) {
        const rowPoints: Array<{ x: number; y: number }> = []
        for (let col = 0; col < cols; col += 1) {
          const idx = row * cols + col
          const base = state.grid[idx]
          if (!base) continue
          let x = base.x
          let y = base.y

          const dx = x - px
          const dy = y - py
          const dist = Math.hypot(dx, dy)
          const falloff = Math.exp(-dist / 220)
          const pull = falloff * 22
          const angle = Math.atan2(dy, dx)
          x -= Math.cos(angle) * pull
          y -= Math.sin(angle) * pull

          let ripple = 0
          const ripples = rippleRef.current
          for (let i = Math.max(0, ripples.length - 14); i < ripples.length; i += 1) {
            const r = ripples[i]
            const age = now - r.t
            const decay = Math.exp(-age / 4200)
            const rx = r.x * state.width
            const ry = r.y * state.height
            const d = Math.hypot(x - rx, y - ry)
            ripple += Math.sin(age * 0.004 - d * 0.035) * decay * (6 + r.v * 120)
          }
          x += Math.cos(angle + Math.PI / 2) * ripple * 0.2
          y += Math.sin(angle + Math.PI / 2) * ripple * 0.2

          rowPoints.push({ x, y })
        }
        deformed.push(rowPoints)
      }

      context.lineWidth = 0.9
      context.lineCap = 'round'

      for (let row = 0; row < deformed.length; row += 1) {
        const rowPoints = deformed[row]
        context.beginPath()
        rowPoints.forEach((point, index) => {
          if (index === 0) context.moveTo(point.x, point.y)
          else context.lineTo(point.x, point.y)
        })
        context.strokeStyle = `rgba(${colorsRef.current.accent}, ${baseAlpha.toFixed(3)})`
        context.stroke()
      }

      for (let col = 0; col < deformed[0]?.length; col += 1) {
        context.beginPath()
        for (let row = 0; row < deformed.length; row += 1) {
          const point = deformed[row][col]
          if (!point) continue
          if (row === 0) context.moveTo(point.x, point.y)
          else context.lineTo(point.x, point.y)
        }
        context.strokeStyle = `rgba(${colorsRef.current.text}, ${(baseAlpha * 0.7).toFixed(3)})`
        context.stroke()
      }

      context.save()
      context.globalCompositeOperation = 'lighter'
      context.filter = 'blur(0.5px)'
      for (let i = Math.max(0, rippleRef.current.length - 12); i < rippleRef.current.length; i += 1) {
        const ripple = rippleRef.current[i]
        const age = now - ripple.t
        const decay = Math.exp(-age / 5200)
        const alpha = clamp(shimmerAlpha * decay, 0.008, 0.18)
        const radius = Math.min(age * 0.035, 220)
        context.strokeStyle = `rgba(${colorsRef.current.accent}, ${alpha.toFixed(3)})`
        context.beginPath()
        context.arc(ripple.x * state.width, ripple.y * state.height, radius, 0, Math.PI * 2)
        context.stroke()
      }
      context.restore()
    }

    const draw = () => {
      const now = performance.now()
      context.clearRect(0, 0, state.width, state.height)

      drawGrid(now)

      const mask = context.createLinearGradient(0, 0, state.width, 0)
      mask.addColorStop(0, 'rgba(0, 0, 0, 1)')
      mask.addColorStop(sideFocusWidth, 'rgba(0, 0, 0, 0.8)')
      mask.addColorStop(0.5, 'rgba(0, 0, 0, 0.42)')
      mask.addColorStop(1 - sideFocusWidth, 'rgba(0, 0, 0, 0.8)')
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
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0.82)')
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
  }, [density, enabled, intensity, sideFocusWidth])

  return <canvas ref={canvasRef} className="bg-geometry" aria-hidden="true" />
}
