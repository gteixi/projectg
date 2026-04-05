'use client'

import { useState, useMemo } from 'react'
import { type Station } from '@/types/database'

const STATION_COLORS: Record<Station, string> = {
  Partida: 'bg-orange-100 text-orange-700',
  Congelador: 'bg-blue-100 text-blue-700',
  Camara: 'bg-teal-100 text-teal-700',
  Timbre: 'bg-pink-100 text-pink-700',
}

export type DemandaRow = {
  production_id: string
  name: string
  unit: string
  station: Station
  consumoDia: number
  pctMerma: number
  ratioEficiencia: number
  sugeridoSemana: number
}

type SortKey = 'name' | 'consumoDia' | 'pctMerma' | 'ratioEficiencia' | 'sugeridoSemana'
type SortDir = 'asc' | 'desc'

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'name', label: 'Preparació', align: 'left' },
  { key: 'consumoDia', label: 'Consum/dia', align: 'right' },
  { key: 'pctMerma', label: '% Merma', align: 'right' },
  { key: 'ratioEficiencia', label: 'Eficiència', align: 'right' },
  { key: 'sugeridoSemana', label: 'Suggerit/set.', align: 'right' },
]

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }): React.JSX.Element {
  return (
    <svg
      className={`inline-block w-3.5 h-3.5 ml-1 transition-transform ${active ? 'text-gray-700' : 'text-gray-300'} ${active && dir === 'asc' ? 'rotate-180' : ''}`}
      fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export function DemandaTable({ rows }: { rows: DemandaRow[] }): React.JSX.Element {
  const [sortKey, setSortKey] = useState<SortKey>('consumoDia')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey): void {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const sorted = useMemo(() =>
    [...rows].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'name') return mul * a.name.localeCompare(b.name)
      return mul * (a[sortKey] - b[sortKey])
    }),
    [rows, sortKey, sortDir]
  )

  return (
    <>
      {/* Mobile: tarjetas apiladas */}
      <ul className="divide-y divide-[#e5e3de] md:hidden">
        {sorted.map((r) => (
          <li key={r.production_id} className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{r.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATION_COLORS[r.station]}`}>
                {r.station}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-gray-500">Consum/dia</p>
                <p className="font-medium text-gray-900">{r.consumoDia.toFixed(1)} {r.unit}</p>
              </div>
              <div>
                <p className="text-gray-500">Suggerit/set.</p>
                <p className="font-medium text-gray-900">{r.sugeridoSemana.toFixed(1)} {r.unit}</p>
              </div>
              <div>
                <p className="text-gray-500">Merma</p>
                <p className={`font-semibold ${r.pctMerma >= 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                  {(r.pctMerma * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-gray-500">Eficiència</p>
                <p className={`font-semibold ${r.ratioEficiencia > 1.5 ? 'text-red-600' : r.ratioEficiencia > 1.2 ? 'text-yellow-600' : 'text-green-600'}`}>
                  x{r.ratioEficiencia.toFixed(1)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Tablet+: tabla */}
      <div className="hidden md:block">
        <table className="w-full text-left table-fixed">
          <colgroup>
            <col className="w-[25%]" />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-[#e5e3de] text-sm text-gray-500">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 font-medium cursor-pointer select-none hover:text-gray-700 transition-colors ${col.align === 'right' ? 'text-right' : ''}`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortArrow active={sortKey === col.key} dir={sortKey === col.key ? sortDir : 'desc'} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e3de]">
            {sorted.map((r) => (
              <tr key={r.production_id}>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">{r.name}</span>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${STATION_COLORS[r.station]}`}>
                      {r.station}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3 text-right font-medium text-gray-900">
                  {r.consumoDia.toFixed(1)} {r.unit}
                </td>
                <td className="px-6 py-3 text-right">
                  <span className={`font-semibold ${r.pctMerma >= 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                    {(r.pctMerma * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <span className={`font-semibold ${r.ratioEficiencia > 1.5 ? 'text-red-600' : r.ratioEficiencia > 1.2 ? 'text-yellow-600' : 'text-green-600'}`}>
                    x{r.ratioEficiencia.toFixed(1)}
                  </span>
                </td>
                <td className="px-6 py-3 text-right font-medium text-gray-900">
                  {r.sugeridoSemana.toFixed(1)} {r.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
