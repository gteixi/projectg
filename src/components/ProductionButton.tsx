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
  const [confirming, setConfirming] = useState<{ quantity: number; batchNumber: string } | null>(null)
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
      setEditBatch(result.batch_number)
    })
  }

  function handleSubmit(): void {
    if (!confirming) return
    const qty = confirming.quantity
    const bn = editBatch.trim()
    if (!bn || bn.length > 5 || !/^[a-zA-Z0-9]+$/.test(bn)) {
      setError('Lot: màx. 5 caràcters alfanumèrics')
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
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl mx-4 w-full max-w-sm flex flex-col overflow-hidden">
        <div className="flex justify-end px-4 pt-4">
          <button onClick={() => setConfirming(null)} disabled={pending} className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 disabled:opacity-50 text-xl">✕</button>
        </div>
        <div className="px-8 pb-6 flex flex-col items-center gap-1 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Confirmar producció
          </div>
          <div className="text-2xl font-bold text-gray-900">{name}</div>
          <div className="text-5xl font-bold tabular-nums mt-3 text-blue-600">
            {confirming.quantity}
            <span className="text-2xl font-semibold text-gray-400 ml-2">{truncUnit(unit)}</span>
          </div>
          <div className="mt-5 flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Lot</span>
            <div className="relative group">
              <input
                type="text"
                value={editBatch}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5)
                  setEditBatch(v)
                }}
                maxLength={5}
                className="w-32 h-12 text-center text-2xl font-mono font-bold text-gray-900 bg-transparent border-b-2 border-gray-300 pl-4 pr-8 focus:border-blue-500 focus:outline-none transition-colors uppercase"
              />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </svg>
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 text-center px-8 pb-2">{error}</p>}
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
          placeholder="Quantitat"
          autoFocus
          disabled={pending}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm()
            if (e.key === 'Escape') close()
          }}
          className="w-24 md:w-32 h-14 text-left text-base md:text-lg border border-[#e5e3de] rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 bg-white shrink-0 overflow-hidden text-ellipsis placeholder:text-gray-400"
        />
        <span className="text-base text-gray-400 w-10 shrink-0">{truncUnit(unit)}</span>
        <button
          onClick={handleConfirm}
          disabled={pending}
          className="flex-1 h-14 rounded-xl border border-blue-600 text-blue-600 text-base font-semibold disabled:opacity-50 hover:bg-blue-50"
        >
          {pending ? '\u2026' : 'Produir'}
        </button>
        {withClose && (
          <button
            onClick={close}
            disabled={pending}
            className="w-14 shrink-0 h-14 rounded-xl bg-red-600 text-white text-base font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            ✕
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600 mt-1.5">{error}</p>}
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
