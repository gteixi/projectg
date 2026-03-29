'use client'

import { useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { logProduction, reserveBatchNumber } from '@/lib/actions'
import { truncUnit } from '@/lib/format'
import { useToast } from '@/components/Toast'

interface Props {
  productionId: string
  name: string
  unit: string
  shelfLifeHours: number | null
  variant?: 'toggle' | 'form'
  onClose?: () => void
  onSuccess?: (quantity: number) => void
}

export function ProductionButton({ productionId, name, unit, shelfLifeHours, variant = 'toggle', onClose, onSuccess }: Props): React.JSX.Element | null {
  const [open, setOpen] = useState(variant === 'form')
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<{ quantity: number; batchNumber: number } | null>(null)
  const [editBatch, setEditBatch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function close(): void {
    setOpen(false)
    setConfirming(null)
    onClose?.()
  }

  function handleConfirm(): void {
    const raw = inputRef.current?.value ?? ''
    const quantity = parseFloat(raw)
    if (isNaN(quantity) || quantity <= 0) {
      setError('Valor no vàlid')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await reserveBatchNumber()
      if (result.error || result.batch_number === null) {
        showToast('Error reservant número de lot')
        return
      }
      setConfirming({ quantity, batchNumber: result.batch_number })
      setEditBatch(String(result.batch_number))
    })
  }

  function handleSubmit(): void {
    if (!confirming) return
    const qty = confirming.quantity
    const bn = parseInt(editBatch, 10)
    if (isNaN(bn) || bn <= 0) {
      setError('Número de lot no vàlid')
      return
    }
    startTransition(async () => {
      const result = await logProduction(productionId, qty, shelfLifeHours, bn)
      if (result.error) {
        showToast(`Error registrant ${name}: ${result.error}`)
      } else {
        onSuccess?.(qty)
        close()
      }
    })
  }

  const confirmModal = confirming ? createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) setConfirming(null) }}
    >
      <div className="bg-white rounded-2xl mx-4 w-full max-w-sm flex flex-col overflow-hidden">
        <div className="px-8 pt-8 pb-6 flex flex-col items-center gap-1 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Confirmar producció
          </div>
          <div className="text-2xl font-bold text-gray-900">{name}</div>
          <div className="text-5xl font-bold tabular-nums mt-3 text-blue-600">
            {confirming.quantity}
            <span className="text-2xl font-semibold text-gray-400 ml-2">{truncUnit(unit)}</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Lote</span>
            <input
              type="number"
              value={editBatch}
              onChange={(e) => setEditBatch(e.target.value)}
              className="w-20 h-9 text-center text-sm font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        {error && <div className="text-sm text-red-600 text-center px-8 pb-2">{error}</div>}
        <div className="p-4 pt-2 flex gap-3">
          <button
            onClick={() => setConfirming(null)}
            disabled={pending}
            className="flex-1 h-16 rounded-xl bg-red-100 text-red-700 text-base font-semibold hover:bg-red-200 disabled:opacity-50"
          >
            Corregir
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending}
            className="flex-1 h-16 rounded-xl text-white text-lg font-semibold disabled:opacity-50 bg-green-600 hover:bg-green-700"
          >
            {pending ? '\u2026' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  const formControls = (withClose: boolean): React.JSX.Element => (
    <>
      {confirmModal}
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
          className="flex-1 md:flex-none md:px-5 h-14 rounded-xl text-white text-base font-semibold disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
        >
          {pending ? '\u2026' : 'OK'}
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
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </>
  )

  if (variant === 'form') return formControls(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-14 px-6 rounded-xl border border-blue-600 text-blue-600 text-base font-semibold transition-colors hover:bg-blue-50"
      >
        + Produir
      </button>
    )
  }

  return formControls(true)
}
