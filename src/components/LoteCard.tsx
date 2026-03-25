'use client'

import { useState } from 'react'
import { CookBadge } from './CookBadge'

export type LotResult = {
  id: string
  lot_number: string
  preparation_name: string
  unit: string
  quantity: number
  logged_at: string
  expires_at: string | null
  cook_name: string | null
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ca-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function ExpiryBadge({ iso }: { iso: string }) {
  const diff = new Date(iso).getTime() - Date.now()
  const expired = diff < 0
  const critical = !expired && diff < 4 * 3600 * 1000
  const cls = expired
    ? 'bg-red-100 text-red-700'
    : critical
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-green-100 text-green-700'
  const date = new Date(iso)
  const label = expired
    ? `Caducat ${formatDateTime(iso)}`
    : `Cad. ${date.toLocaleString('ca-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${cls}`}>
      {label}
    </span>
  )
}

export function LoteCard({ lot }: { lot: LotResult }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-[#e5e3de] overflow-hidden">
      <button
        className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${open ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="shrink-0 text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1">
          {lot.lot_number}
        </span>
        <span className="flex-1 text-base font-bold text-gray-900 truncate min-w-0">
          {lot.preparation_name}
        </span>
        {lot.expires_at && (
          <span className="shrink-0 hidden sm:block">
            <ExpiryBadge iso={lot.expires_at} />
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
              ? <ExpiryBadge iso={lot.expires_at} />
              : <span className="text-sm text-gray-400">—</span>
            }
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Cuiner</span>
            {lot.cook_name
              ? <CookBadge name={lot.cook_name} />
              : <span className="text-sm text-gray-400">—</span>
            }
          </div>
        </div>
      )}
    </div>
  )
}
