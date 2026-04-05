'use client'

import { createContext, useCallback, useContext, useState, useEffect, useRef, type ReactNode } from 'react'

type ToastType = 'error' | 'success'
type Toast = { id: number; message: string; type: ToastType }

const TOAST_DURATION_MS = 4000

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }): React.JSX.Element {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, TOAST_DURATION_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [onDismiss])

  const cls = toast.type === 'error'
    ? 'bg-red-600 text-white'
    : 'bg-green-600 text-white'

  return (
    <div
      className={`${cls} px-5 py-3 rounded-xl text-base font-semibold shadow-lg flex items-center gap-3 animate-[slideUp_0.2s_ease-out]`}
      role="alert"
    >
      <span className="flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100 text-lg leading-none">✕</button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div aria-live="polite" aria-atomic="true" className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm md:bottom-6">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>
      )}
    </ToastContext>
  )
}
