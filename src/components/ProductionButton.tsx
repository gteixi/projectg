'use client'

import { useRef, useState, useTransition } from 'react'
import { logProduction } from '@/lib/actions'

interface Props {
  preparationId: string
  unit: string
  shelfLifeHours: number
}

export function ProductionButton({ preparationId, unit, shelfLifeHours }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleConfirm() {
    const raw = inputRef.current?.value ?? ''
    const quantity = parseFloat(raw)
    if (isNaN(quantity) || quantity <= 0) {
      setError('Valor no vàlid')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await logProduction(preparationId, quantity, shelfLifeHours)
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-14 px-6 rounded-xl border border-blue-600 text-blue-600 text-base font-semibold hover:bg-blue-50 transition-colors"
      >
        + Produir
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        ref={inputRef}
        type="number"
        min="0.1"
        step="0.1"
        placeholder="quant."
        autoFocus
        disabled={pending}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleConfirm()
          if (e.key === 'Escape') setOpen(false)
        }}
        className="flex-1 min-w-0 max-w-[3.5rem] h-14 text-right text-lg border border-[#e5e3de] rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 bg-white"
      />
      <span className="text-base text-gray-400 w-[3rem] truncate shrink-0">{unit}</span>
      <button
        onClick={handleConfirm}
        disabled={pending}
        className="h-14 px-6 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 disabled:opacity-50 shrink-0"
      >
        {pending ? '…' : 'OK'}
      </button>
      <button
        onClick={() => setOpen(false)}
        disabled={pending}
        className="h-14 w-14 rounded-xl border border-[#e5e3de] text-gray-500 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center text-lg shrink-0"
      >
        ✕
      </button>
      {error && <span className="text-base text-red-600 w-full">{error}</span>}
    </div>
  )
}
