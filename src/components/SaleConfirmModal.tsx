'use client'

import { createPortal } from 'react-dom'
import { type FifoBreakdown, type ActiveLot } from '@/types/database'

interface Props {
  quantity: string
  unitLabel: string
  reasonLabel: string
  stock: number
  lots: ActiveLot[]
  breakdown: FifoBreakdown[]
  serverError: string | null
  pending: boolean
  onCorrect: () => void
  onSubmit: () => void
}

export function SaleConfirmModal({
  quantity,
  unitLabel,
  reasonLabel,
  stock,
  lots,
  breakdown,
  serverError,
  pending,
  onCorrect,
  onSubmit,
}: Props): React.JSX.Element | null {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl mx-4 w-full max-w-sm flex flex-col overflow-hidden">
        <div className="flex justify-end px-4 pt-4">
          <button onClick={onCorrect} disabled={pending} className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 disabled:opacity-50 text-xl">✕</button>
        </div>
        <div className="px-8 pb-6 flex flex-col items-center gap-1 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Confirmar venda</div>
          <div className="text-5xl font-bold text-red-600 tabular-nums mt-3">
            -{quantity}
            <span className="text-2xl font-semibold text-gray-400 ml-2">{unitLabel}</span>
          </div>
          <div className="mt-2 text-base font-semibold text-gray-600">{reasonLabel}</div>
          <div className="mt-3 flex flex-col gap-1.5 w-full">
            {breakdown.map((b) => {
              const lot = lots.find((l) => l.batch_number === b.batch_number)
              const before = lot?.quantity ?? b.quantity
              const after = Math.round((before - b.quantity) * 100) / 100
              return (
                <div key={b.batch_number} className="flex items-center justify-between px-3 py-1.5 bg-red-50 rounded-lg">
                  <span className="text-sm font-mono text-gray-600">Lot #{b.batch_number}</span>
                  <span className="text-sm tabular-nums text-gray-500">
                    {before} − {b.quantity} = <span className="font-bold text-gray-900">{after} {unitLabel}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        {serverError && <div className="text-sm text-red-600 text-center px-8 pb-2">{serverError}</div>}
        <div className="p-4 pt-2 flex gap-3">
          <button
            onClick={onCorrect}
            disabled={pending}
            className="flex-1 h-16 rounded-xl bg-red-100 text-red-700 text-base font-semibold hover:bg-red-200 disabled:opacity-50"
          >
            Corregir
          </button>
          <button
            onClick={onSubmit}
            disabled={pending}
            className="flex-1 h-16 rounded-xl bg-red-600 text-white text-lg font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? '\u2026' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
