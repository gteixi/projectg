export type Station = 'Partida' | 'Congelador' | 'Camara' | 'Timbre'
export type SaleReason = 'merma' | 'venta'

export interface ActiveLot {
  log_id: string
  batch_number: number
  quantity: number
  expires_at: string
}

export interface FifoBreakdown {
  batch_number: number
  quantity: number
}

export interface Production {
  id: string
  name: string
  unit: string
  shelf_life_hours: number | null
  station: Station
  active: boolean
  created_at: string
}

export interface ProductionLog {
  id: string
  production_id: string
  quantity: number
  expires_at: string | null
  logged_at: string
  batch_number: number | null
}

export interface StockActualHoy {
  production_id: string
  name: string
  unit: string
  shelf_life_hours: number | null
  station: Station
  stock_total: number
  next_expiry: string | null
}

export interface StockExit {
  id: string
  production_id: string
  quantity: number
  reason: SaleReason
  logged_at: string
}

export interface StockExitLot {
  exit_id: string
  batch_number: number
  quantity: number
}

export type ActionResult = { error: string | null }

export interface ProductionJoin {
  name: string
  unit: string
  station?: Station
}

export interface ExitLotJoin {
  batch_number: number
  quantity: number
}
