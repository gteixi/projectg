'use client'

import { useRef, useState, useTransition, useEffect } from 'react'
import { logProduction } from '@/lib/actions'
import { truncUnit } from '@/lib/format'
import { generateLotNumber } from '@/lib/lot-number'
import { useAuth } from './AuthProvider'

interface Props {
  preparationId: string
  unit: string
  shelfLifeHours: number
  variant?: 'toggle' | 'form'
  onClose?: () => void
}

export function ProductionButton({ preparationId, unit, shelfLifeHours, variant = 'toggle', onClose }: Props) {
  const [open, setOpen] = useState(variant === 'form')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [lotNumber, setLotNumber] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { activeUser } = useAuth()

  useEffect(() => {
    if (open) generateLotNumber().then(setLotNumber)
  }, [open])

  function close() {
    setOpen(false)
    setLotNumber('')
    onClose?.()
  }

  function handleConfirm() {
    const raw = inputRef.current?.value ?? ''
    const quantity = parseFloat(raw)
    if (isNaN(quantity) || quantity <= 0) {
      setError('Valor no vàlid')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await logProduction(preparationId, quantity, shelfLifeHours, lotNumber || undefined, activeUser.id)
      if (result.error) {
        setError(result.error)
      } else {
        close()
      }
    })
  }

  const formControls = (withClose: boolean) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
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
            if (e.key === 'Escape') close()
          }}
          className="w-24 h-14 text-right text-lg border border-[#e5e3de] rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 bg-white shrink-0"
        />
        <span className="text-base text-gray-400 w-10 shrink-0">{truncUnit(unit)}</span>
        <button
          onClick={handleConfirm}
          disabled={pending}
          className="flex-1 md:flex-none md:px-5 h-14 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? '…' : 'OK'}
        </button>
        {withClose && (
          <button
            onClick={close}
            disabled={pending}
            className="flex-1 md:flex-none md:px-5 h-14 rounded-xl bg-red-600 text-white text-base font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            ✕
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-500 shrink-0 w-14">Nº Lot</label>
        <input
          type="text"
          value={lotNumber}
          onChange={(e) => setLotNumber(e.target.value)}
          placeholder="LOT-YYYYMMDD-001 (opcional)"
          disabled={pending}
          className="flex-1 h-10 text-sm font-mono border border-[#e5e3de] rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 bg-white text-gray-700 placeholder:font-sans placeholder:text-gray-400"
        />
      </div>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  )

  if (variant === 'form') return formControls(false)

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

  return formControls(true)
}
