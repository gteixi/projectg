'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithPin } from '@/lib/auth'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

export function PinPad(): React.JSX.Element {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleKey(key: string): void {
    setError(null)
    if (key === 'del') {
      setPin((p) => p.slice(0, -1))
      return
    }
    if (pin.length >= 4) return
    const next = pin + key
    setPin(next)
    if (next.length === 4) {
      startTransition(async () => {
        const result = await loginWithPin(next)
        if (result.error) {
          setError(result.error)
          setPin('')
        } else {
          router.push('/urgent')
          router.refresh()
        }
      })
    }
  }

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-colors ${
              pin.length > i
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-[#e5e3de] bg-white text-transparent'
            }`}
          >
            {pin.length > i ? '•' : ''}
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-base font-semibold">{error}</p>}

      <div className="grid grid-cols-3 gap-3 w-full">
        {KEYS.map((key, i) => {
          if (key === '') return <div key={i} />
          if (key === 'del') {
            return (
              <button
                key={i}
                onClick={() => handleKey('del')}
                disabled={pending || pin.length === 0}
                className="h-16 rounded-xl bg-gray-200 text-gray-700 text-lg font-semibold hover:bg-gray-300 disabled:opacity-30 transition-colors"
              >
                ←
              </button>
            )
          }
          return (
            <button
              key={i}
              onClick={() => handleKey(key)}
              disabled={pending}
              className="h-16 rounded-xl bg-white border border-[#e5e3de] text-gray-900 text-2xl font-semibold hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {key}
            </button>
          )
        })}
      </div>

      {pending && <p className="text-gray-400 text-sm">Verificant…</p>}
    </div>
  )
}
