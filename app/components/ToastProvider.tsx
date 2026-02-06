'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type Toast = ToastInput & {
  id: string
}

type ToastContextValue = {
  addToast: (toast: ToastInput) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const createToastId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeoutsRef = useRef<Record<string, number>>({})

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
    if (timeoutsRef.current[id]) {
      window.clearTimeout(timeoutsRef.current[id])
      delete timeoutsRef.current[id]
    }
  }, [])

  const addToast = useCallback(
    ({ variant = 'info', duration = 3200, ...toast }: ToastInput) => {
      const id = createToastId()
      const nextToast: Toast = {
        id,
        variant,
        duration,
        ...toast,
      }
      setToasts(prev => [nextToast, ...prev].slice(0, 5))
      timeoutsRef.current[id] = window.setTimeout(() => removeToast(id), duration)
    },
    [removeToast]
  )

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast toast-${toast.variant}`}
            role={toast.variant === 'error' ? 'alert' : 'status'}
          >
            <div className="toast-body">
              <p className="toast-title">{toast.title}</p>
              {toast.description && <p className="toast-desc">{toast.description}</p>}
            </div>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss notification"
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
