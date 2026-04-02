import { Station, SaleReason, ExitReason } from '@/types/database'

export const STATIONS: Station[] = ['Partida', 'Congelador', 'Camara', 'Timbre']

export const SALE_REASONS: { value: SaleReason; label: string }[] = [
  { value: 'merma', label: 'Merma' },
  { value: 'venta', label: 'Venta' },
]

export const REASON_LABELS: Record<SaleReason, string> = {
  merma: 'Merma',
  venta: 'Venta',
}

export const EXIT_REASONS: { value: ExitReason; label: string }[] = [
  { value: 'accident', label: 'Accident' },
  { value: 'mal_estat', label: 'Mal estat' },
  { value: 'altre', label: 'Altre' },
]

export const EXIT_REASON_LABELS: Record<ExitReason, string> = {
  accident: 'Accident',
  mal_estat: 'Mal estat',
  altre: 'Altre',
}

export const UNITS = ['kg', 'L', 'raciones'] as const
export type Unit = (typeof UNITS)[number]

export const MS_PER_HOUR = 3_600_000
export const MS_PER_DAY = 86_400_000
export const HISTORIAL_DAYS = 7
export const HISTORIAL_LOGS_LIMIT = 500
export const HISTORIAL_EXITS_LIMIT = 200
export const HISTORIAL_MOVES_LIMIT = 200
export const TRAZABILIDAD_PAGE_SIZE = 10
export const TRAZABILIDAD_FETCH_LIMIT = 500
export const URGENT_LOOKAHEAD_DAYS = 2
export const FIFO_TOLERANCE = 0.001
export const FIFO_ROUNDING_FACTOR = 1000
export const UNIT_TRUNCATE_LENGTH = 4
export const UNIT_TRUNCATE_SLICE = 3
export const MIN_PREP_NAME_LENGTH = 2
export const LOCALE = 'ca-ES' as const
