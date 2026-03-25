import { createServerClient } from '@/lib/supabase'
import { OpeningInput } from '@/components/OpeningInput'
import { ProductionButton } from '@/components/ProductionButton'
import { PrepRow } from '@/components/PrepRow'
import { Sidebar } from '@/components/Sidebar'
import { CollapsibleStation } from '@/components/CollapsibleStation'
import { StockActualHoy, Station } from '@/types/database'
import { truncUnit } from '@/lib/format'


const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111'
const STATIONS: Station[] = ['Fríos', 'Fuegos', 'Postres']

type StationTheme = {
  accentBorder: string
  accentText: string
  accentBg: string
  accentTextLight: string
}

const STATION_THEMES: Record<Station, StationTheme> = {
  Fríos: {
    accentBorder: 'border-l-blue-500',
    accentText: 'text-blue-700',
    accentBg: 'bg-blue-50',
    accentTextLight: 'text-blue-600',
  },
  Fuegos: {
    accentBorder: 'border-l-orange-500',
    accentText: 'text-orange-700',
    accentBg: 'bg-orange-50',
    accentTextLight: 'text-orange-600',
  },
  Postres: {
    accentBorder: 'border-l-pink-500',
    accentText: 'text-pink-700',
    accentBg: 'bg-pink-50',
    accentTextLight: 'text-pink-600',
  },
  Panadería: {
    accentBorder: 'border-l-amber-500',
    accentText: 'text-amber-700',
    accentBg: 'bg-amber-50',
    accentTextLight: 'text-amber-600',
  },
  Entrantes: {
    accentBorder: 'border-l-teal-500',
    accentText: 'text-teal-700',
    accentBg: 'bg-teal-50',
    accentTextLight: 'text-teal-600',
  },
}

function formatExpiry(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const time = date.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })

  if (date.toDateString() === now.toDateString()) return `cad. ${time}`
  if (date.toDateString() === new Date(now.getTime() + 86400000).toDateString())
    return `cad. demà ${time}`
  return `cad. ${date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })} ${time}`
}

function Semaforo({ faltaProducir, parQuantity }: { faltaProducir: number; parQuantity: number }) {
  if (faltaProducir === 0) {
    return <span className="w-4 h-4 rounded-full bg-green-600 shrink-0 inline-block" title="OK" />
  }
  if (faltaProducir < parQuantity) {
    return <span className="w-4 h-4 rounded-full bg-yellow-500 shrink-0 inline-block" title="Parcial" />
  }
  return <span className="w-4 h-4 rounded-full bg-red-600 shrink-0 inline-block" title="Pendent" />
}

function ExpiryAlerts({ items }: { items: StockActualHoy[] }) {
  const now = new Date()
  const critical = items.filter(
    (i) => i.proxima_caducidad && new Date(i.proxima_caducidad).getTime() - now.getTime() < 4 * 3600 * 1000
  )
  const warning = items.filter((i) => {
    if (!i.proxima_caducidad) return false
    const diff = new Date(i.proxima_caducidad).getTime() - now.getTime()
    return diff >= 4 * 3600 * 1000 && diff < 8 * 3600 * 1000
  })

  if (critical.length === 0 && warning.length === 0) return null

  return (
    <div className="flex flex-col gap-2 mb-6">
      {critical.map((i) => (
        <div
          key={i.preparation_id}
          className="flex items-center gap-3 rounded-xl border-l-4 border-red-500 bg-red-50 border border-red-200 px-4 py-3"
        >
          <span className="w-3 h-3 rounded-full bg-red-600 shrink-0" />
          <span className="font-semibold text-base text-red-800 min-w-0 truncate">{i.name}</span>
          <span className="text-sm font-medium text-red-600 ml-auto shrink-0">{formatExpiry(i.proxima_caducidad!)}</span>
        </div>
      ))}
      {warning.map((i) => (
        <div
          key={i.preparation_id}
          className="flex items-center gap-3 rounded-xl border-l-4 border-yellow-500 bg-yellow-50 border border-yellow-200 px-4 py-3"
        >
          <span className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
          <span className="font-semibold text-base text-yellow-800 min-w-0 truncate">{i.name}</span>
          <span className="text-sm font-medium text-yellow-600 ml-auto shrink-0">{formatExpiry(i.proxima_caducidad!)}</span>
        </div>
      ))}
    </div>
  )
}

// Mobile card per a cada preparació
function PrepCard({ item }: { item: StockActualHoy }) {
  const isDone = item.falta_producir === 0
  return (
    <div className={`p-4 border-b border-[#e5e3de] last:border-0 ${isDone ? 'bg-green-50' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Semaforo faltaProducir={item.falta_producir} parQuantity={item.par_quantity} />
          <div className="min-w-0">
            <div className="text-base font-semibold text-gray-900 leading-tight">{item.name}</div>
            {item.proxima_caducidad && (
              <div className="text-sm font-semibold text-red-600 tabular-nums leading-tight">
                {formatExpiry(item.proxima_caducidad)}
              </div>
            )}
          </div>
        </div>
        {item.falta_producir > 0 ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold tabular-nums shrink-0">
            −{item.falta_producir} {truncUnit(item.unit)}
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold shrink-0">
            ✓
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 text-sm text-gray-500 mb-3">
        <span>
          Stock:{' '}
          <strong className="text-gray-800 tabular-nums">
            {item.stock_total} {truncUnit(item.unit)}
          </strong>
        </span>
        <span>
          Par:{' '}
          <strong className="text-gray-500 tabular-nums">
            {item.par_quantity} {truncUnit(item.unit)}
          </strong>
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <OpeningInput preparationId={item.preparation_id} unit={item.unit} />
        <ProductionButton
          preparationId={item.preparation_id}
          unit={item.unit}
          shelfLifeHours={item.shelf_life_hours}
        />
      </div>
    </div>
  )
}

// Fila de taula per a pantalles grans

function StationCard({ station, items }: { station: Station; items: StockActualHoy[] }) {
  const theme = STATION_THEMES[station]
  const total = items.length
  const ok = items.filter((i) => i.falta_producir === 0).length
  const pending = items.filter((i) => i.falta_producir === i.par_quantity).length
  const partial = total - ok - pending

  const badges = (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold px-3 py-1">
        <span className="w-2 h-2 rounded-full bg-green-600 inline-block" />
        {ok}
      </span>
      {partial > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
          {partial}
        </span>
      )}
      {pending > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 text-sm font-semibold px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
          {pending}
        </span>
      )}
    </div>
  )

  return (
    <CollapsibleStation
      accentBorder={theme.accentBorder}
      accentBg={theme.accentBg}
      accentText={theme.accentText}
      title={station}
      headerRight={badges}
    >
      {/* Mòbil: cards */}
      <div className="md:hidden">
        {items.map((item) => (
          <PrepCard key={item.preparation_id} item={item} />
        ))}
      </div>

      {/* Tablet/escriptori: taula */}
      <div className="hidden md:block px-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e3de]">
              <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Preparació</th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Stock</th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Par</th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Falta</th>
              <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">Obertura</th>
              <th className="py-3 pl-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 w-[280px]">Producció</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <PrepRow key={item.preparation_id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleStation>
  )
}

export default async function Home() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('stock_actual_hoy')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .order('name')

  if (error) {
    return <pre className="p-8 text-red-500">{JSON.stringify(error, null, 2)}</pre>
  }

  const items = (data ?? []) as StockActualHoy[]
  const grouped = STATIONS.reduce<Record<Station, StockActualHoy[]>>(
    (acc, station) => {
      acc[station] = items.filter((i) => i.station === station)
      return acc
    },
    {} as Record<Station, StockActualHoy[]>
  )

  const today = new Date().toLocaleDateString('ca-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Prep List</h1>
            <p className="text-base text-gray-500 capitalize mt-0.5 md:text-lg">{today}</p>
          </header>
          <ExpiryAlerts items={items} />
          <div className="flex flex-col gap-4 md:gap-5">
            {STATIONS.filter((s) => grouped[s].length > 0).map((station) => (
              <StationCard key={station} station={station} items={grouped[station]} />
            ))}
            {items.length === 0 && (
              <p className="text-center text-gray-400 text-lg py-16">Sense dades per avui</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
