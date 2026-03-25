'use client'

import { useRef, useState, useTransition } from 'react'
import { logOpeningStock } from '@/lib/actions'

interface Props {
  preparationId: string
  unit: string
}

export function OpeningInput({ preparationId, unit }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit() {
    const raw = inputRef.current?.value ?? ''
    const quantity = parseFloat(raw)
    if (isNaN(quantity) || quantity < 0) {
      setError('Valor no vàlid')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await logOpeningStock(preparationId, quantity)
      if (result.error) {
        setError(result.error)
      } else {
        setDone(true)
      }
    })
  }

  if (done) {
    return (
      <span className="inline-flex items-center h-14 px-4 rounded-xl bg-green-50 text-green-700 text-base font-medium border border-green-200">
        ✓ Registrat
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        ref={inputRef}
        type="number"
        min="0"
        step="0.1"
        placeholder="0"
        disabled={pending}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        className="flex-1 min-w-0 max-w-[3.5rem] h-14 text-right text-lg border border-[#e5e3de] rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 bg-white"
      />
      <span className="text-base text-gray-400 w-[3rem] truncate shrink-0">{unit}</span>
      <button
        onClick={handleSubmit}
        disabled={pending}
        className="h-14 px-6 rounded-xl bg-gray-800 text-white text-base font-medium hover:bg-gray-700 disabled:opacity-50 shrink-0"
      >
        {pending ? '…' : 'OK'}
      </button>
      {error && <span className="text-sm text-red-600 w-full">{error}</span>}
    </div>
  )
}
