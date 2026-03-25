'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Sidebar } from '@/components/Sidebar'

const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111'

type LotResult = {
  id: string
  lot_number: string
  preparation_name: string
  unit: string
  quantity: number
  logged_at: string
  expires_at: string | null
  cook_name: string | null
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('ca-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatExpiry(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  if (diff < 0) return `Caducat ${formatDateTime(iso)}`
  const label = date.toLocaleString('ca-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return `Cad. ${label}`
}

const COOK_COLORS = [
  { bg: 'bg-blue-600',   text: 'text-white' },
  { bg: 'bg-red-600',    text: 'text-white' },
  { bg: 'bg-green-600',  text: 'text-white' },
  { bg: 'bg-yellow-400', text: 'text-gray-900' },
  { bg: 'bg-purple-600', text: 'text-white' },
  { bg: 'bg-orange-500', text: 'text-white' },
  { bg: 'bg-cyan-500',   text: 'text-white' },
  { bg: 'bg-pink-600',   text: 'text-white' },
]

function cookColorIndex(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return hash % COOK_COLORS.length
}

function CookBadge({ name }: { name: string }) {
  const { bg, text } = COOK_COLORS[cookColorIndex(name)]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${bg} ${text}`}>
      {name}
    </span>
  )
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
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${cls}`}>
      {formatExpiry(iso)}
    </span>
  )
}

export default function TrazabilidadPage() {
  const [query, setQuery] = useState('')
  const [allResults, setAllResults] = useState<LotResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: logs, error: logsErr } = await supabase
        .from('production_logs')
        .select('id, preparation_id, quantity, logged_at, expires_at, batch_number, kitchen_user_id')
        .eq('type', 'production')
        .not('batch_number', 'is', null)
        .order('logged_at', { ascending: false })
        .limit(200)

      if (logsErr) { setError(logsErr.message); setLoading(false); return }
      if (!logs || logs.length === 0) { setLoading(false); return }

      const prepIds = [...new Set(logs.map((l) => l.preparation_id))]
      const { data: preps, error: prepsErr } = await supabase
        .from('preparations')
        .select('id, name, unit')
        .in('id', prepIds)
        .eq('restaurant_id', RESTAURANT_ID)

      if (prepsErr) { setError(prepsErr.message); setLoading(false); return }

      const cookIds = [...new Set(logs.map((l) => l.kitchen_user_id).filter(Boolean))] as string[]
      let cookMap = new Map<string, string>()
      if (cookIds.length > 0) {
        const { data: cooks } = await supabase
          .from('kitchen_users')
          .select('id, name')
          .in('id', cookIds)
        cookMap = new Map((cooks ?? []).map((c) => [c.id, c.name]))
      }

      const prepMap = new Map((preps ?? []).map((p) => [p.id, p]))
      setAllResults(logs.map((log) => {
        const prep = prepMap.get(log.preparation_id)
        return {
          id: log.id,
          lot_number: log.batch_number ?? '',
          preparation_name: prep?.name ?? 'Desconeguda',
          unit: prep?.unit ?? '',
          quantity: log.quantity,
          logged_at: log.logged_at,
          expires_at: log.expires_at,
          cook_name: log.kitchen_user_id ? (cookMap.get(log.kitchen_user_id) ?? null) : null,
        }
      }))
      setLoading(false)
    }
    load()
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allResults
    return allResults.filter(
      (r) =>
        r.lot_number.toLowerCase().includes(q) ||
        r.preparation_name.toLowerCase().includes(q)
    )
  }, [query, allResults])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Lote</h1>
            <p className="text-base text-gray-500 mt-0.5 md:text-lg">Cerca per número de lot o preparació</p>
          </header>

          <div className="relative mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="LOT-20260325-001 o nom de preparació…"
              className="w-full h-14 pl-14 pr-4 text-lg border border-[#e5e3de] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
            />
          </div>

          {error && <p className="text-red-600 text-base mb-4">{error}</p>}

          {loading && (
            <p className="text-center text-gray-400 text-base py-12">Carregant…</p>
          )}

          {!loading && results.length === 0 && (
            <div className="bg-white rounded-xl border border-[#e5e3de] px-6 py-10 text-center">
              <p className="text-gray-400 text-lg">
                {query.trim()
                  ? <>Cap lot trobat per <span className="font-mono font-semibold text-gray-600">{query.trim()}</span></>
                  : 'Sense lots registrats'}
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="flex flex-col gap-3">
              {results.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-[#e5e3de] overflow-hidden">
                  {/* Header: lot number + prep name */}
                  <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#f0ede8]">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="shrink-0 text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1">
                        {r.lot_number}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight truncate">{r.preparation_name}</h3>
                    </div>
                  </div>

                  {/* Data rows */}
                  <div className="divide-y divide-[#f0ede8]">
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Producció</span>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-base font-bold tabular-nums text-gray-900">
                          {r.quantity} <span className="text-sm font-medium text-gray-500">{r.unit}</span>
                        </span>
                        <span className="text-sm text-gray-400">{formatDateTime(r.logged_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Caducitat</span>
                      {r.expires_at
                        ? <ExpiryBadge iso={r.expires_at} />
                        : <span className="text-sm text-gray-400">—</span>
                      }
                    </div>

                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Cuiner</span>
                      {r.cook_name
                        ? <CookBadge name={r.cook_name} />
                        : <span className="text-sm text-gray-400">—</span>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
