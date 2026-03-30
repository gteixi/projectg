'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { formatDateTime, truncUnit } from '@/lib/format'
import { LOCALE, CRITICAL_EXPIRY_MS, SALE_REASONS } from '@/lib/constants'
import { type Station, type SaleReason } from '@/types/database'
import { createSaleExit } from '@/lib/sale-actions'
import { useToast } from '@/components/Toast'

const STATION_COLORS: Record<Station, string> = {
  Partida: 'bg-orange-100 text-orange-700',
  Congelador: 'bg-blue-100 text-blue-700',
  Camara: 'bg-teal-100 text-teal-700',
  Timbre: 'bg-pink-100 text-pink-700',
}

export type LotResult = {
  id: string
  production_id?: string
  lot_number: number | null
  preparation_name: string
  unit: string
  quantity: number
  logged_at: string
  expires_at: string | null
  station?: Station
}

function ExpiryBadge({ iso, now }: { iso: string; now: number }): React.JSX.Element {
  const diff = new Date(iso).getTime() - now
  const expired = diff < 0
  const critical = !expired && diff < CRITICAL_EXPIRY_MS
  const cls = expired
    ? 'bg-red-100 text-red-700'
    : critical
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-green-100 text-green-700'
  const date = new Date(iso)
  const label = expired
    ? `Caducat ${formatDateTime(iso)}`
    : `Cad. ${date.toLocaleString(LOCALE, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${cls}`}>
      {label}
    </span>
  )
}

function LotSaleForm({ lot, onClose }: { lot: LotResult; onClose: () => void }): React.JSX.Element {
  const { showToast } = useToast()
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState<SaleReason>('merma')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState<{ qty: number; reason: SaleReason } | null>(null)

  const unitLabel = truncUnit(lot.unit)
  const reasonLabel = SALE_REASONS.find((r) => r.value === reason)?.label ?? reason

  function handleSale(): void {
    setError(null)
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      setError('Introdueix una quantitat vàlida')
      return
    }
    if (qty > lot.quantity) {
      setError(`Màx. ${lot.quantity} ${unitLabel}`)
      return
    }
    setConfirming({ qty, reason })
  }

  function handleSubmit(): void {
    if (!confirming) return
    const prodId = lot.production_id
    const lotNum = lot.lot_number
    if (!prodId || lotNum === null) return

    startTransition(async () => {
      const result = await createSaleExit(
        prodId,
        confirming.qty,
        confirming.reason,
        [{ batch_number: lotNum, quantity: confirming.qty }],
      )
      if (result.error) {
        showToast(`Error: ${result.error}`)
      } else {
        onClose()
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
            Confirmar sortida
          </div>
          <div className="text-2xl font-bold text-gray-900">{lot.preparation_name}</div>
          <div className="text-5xl font-bold tabular-nums mt-3 text-red-600">
            {confirming.qty}
            <span className="text-2xl font-semibold text-gray-400 ml-2">{unitLabel}</span>
          </div>
          <div className="mt-2 text-base font-semibold text-gray-600">{reasonLabel}</div>
          <div className="mt-3 flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between px-3 py-1.5 bg-red-50 rounded-lg">
              <span className="text-sm font-mono text-gray-600">Lot #{lot.lot_number}</span>
              <span className="text-sm font-bold tabular-nums text-gray-900">{confirming.qty} {unitLabel}</span>
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
            className="flex-1 h-16 rounded-xl text-white text-lg font-semibold disabled:opacity-50 bg-red-600 hover:bg-red-700"
          >
            {pending ? '\u2026' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div className="px-5 py-3 flex flex-col gap-2">
      {confirmModal}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0.1"
          step="0.1"
          max={lot.quantity}
          placeholder="Quantitat"
          value={quantity}
          onChange={(e) => { setQuantity(e.target.value); setError(null) }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSale() }}
          autoFocus
          disabled={pending}
          className="w-24 md:w-32 h-14 text-left text-lg border border-red-300 rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 bg-white shrink-0 overflow-hidden text-ellipsis placeholder:text-gray-400"
        />
        <span className="text-base text-gray-400 w-10 shrink-0">{unitLabel}</span>
        <div className="flex-1 flex gap-1.5">
          {SALE_REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              disabled={pending}
              className={`flex-1 h-14 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
                reason === r.value
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'border-[#e5e3de] text-gray-600 hover:bg-red-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          disabled={pending}
          className="w-14 shrink-0 h-14 rounded-xl border border-[#e5e3de] text-gray-400 text-base font-semibold hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          ✕
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-1.5">{error}</p>}
      <button
        onClick={handleSale}
        disabled={pending}
        className="w-full h-14 rounded-xl border border-red-600 text-red-600 text-base font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        Sale
      </button>
    </div>
  )
}

export function LoteCard({ lot, variant, showSale = false }: { lot: LotResult; variant?: 'critical' | 'warning' | 'tomorrow'; showSale?: boolean }): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [now] = useState(() => Date.now())

  const cardCls = variant === 'critical'
    ? 'border-l-4 border-l-red-500 bg-red-50 border-red-200'
    : variant === 'warning'
    ? 'border-l-4 border-l-yellow-500 bg-yellow-50 border-yellow-200'
    : variant === 'tomorrow'
    ? 'border-l-4 border-l-blue-400 bg-blue-50 border-blue-200'
    : 'bg-white border-[#e5e3de]'

  const canSale = showSale && lot.production_id && lot.lot_number !== null

  return (
    <div className={`rounded-xl border overflow-hidden ${cardCls}`}>
      <button
        className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${open ? 'bg-black/5' : 'hover:bg-black/5'}`}
        onClick={() => { setOpen((v) => { if (v) setShowForm(false); return !v }) }}
      >
        <span className="shrink-0 text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1">
          {lot.lot_number}
        </span>
        <span className="flex-1 text-base font-bold text-gray-900 truncate min-w-0">
          {lot.preparation_name}
        </span>
        {lot.expires_at && (
          <span className="shrink-0 hidden sm:block">
            <ExpiryBadge iso={lot.expires_at} now={now} />
          </span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="divide-y divide-[#f0ede8] border-t border-[#e5e3de]">
          {lot.station && (
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Secció</span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${STATION_COLORS[lot.station]}`}>
                {lot.station}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Producció</span>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-base font-bold tabular-nums text-gray-900">
                {lot.quantity} <span className="text-sm font-medium text-gray-500">{lot.unit}</span>
              </span>
              <span className="text-sm text-gray-400">{formatDateTime(lot.logged_at)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Caducitat</span>
            {lot.expires_at
              ? <ExpiryBadge iso={lot.expires_at} now={now} />
              : <span className="text-sm text-gray-400">—</span>
            }
          </div>

          {canSale && !showForm && (
            <div className="px-5 py-3">
              <button
                onClick={() => setShowForm(true)}
                className="w-full h-14 rounded-xl border border-red-600 text-red-600 text-base font-semibold hover:bg-red-50 transition-colors"
              >
                Sale
              </button>
            </div>
          )}
          {canSale && showForm && <LotSaleForm lot={lot} onClose={() => setShowForm(false)} />}
        </div>
      )}
    </div>
  )
}
