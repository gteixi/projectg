export type Station = 'Partida' | 'Congelador' | 'Camara' | 'Timbre'
export type SaleReason = 'merma' | 'venta'
export type ExitReason = 'accident' | 'mal_estat' | 'altre'

export interface ActiveLot {
  log_id: string
  batch_number: string
  quantity: number
  expires_at: string | null
  current_station: Station | null
}

export interface FifoBreakdown {
  batch_number: string
  quantity: number
}

export interface Production {
  id: string
  name: string
  unit: string
  shelf_life_hours: number | null
  station: Station
  active: boolean
  kitchen_user_id: string
  created_at: string
  recipe: string | null
  recipe_photos: string[]
}

export interface ProductionLog {
  id: string
  production_id: string
  quantity: number
  expires_at: string | null
  logged_at: string
  batch_number: string | null
  kitchen_user_id: string
}

export interface StockActualHoy {
  production_id: string
  name: string
  unit: string
  shelf_life_hours: number | null
  station: Station
  kitchen_user_id: string
  stock_total: number
  next_expiry: string | null
}

export interface StockExit {
  id: string
  production_id: string
  quantity: number
  reason: SaleReason
  exit_reason: ExitReason | null
  logged_at: string
  kitchen_user_id: string
}

export interface StockExitLot {
  exit_id: string
  batch_number: string
  quantity: number
  kitchen_user_id: string
}

export type ActionResult = { error: string | null }

export interface ProductionJoin {
  name: string
  unit: string
  station?: Station
}

export interface ExitLotJoin {
  batch_number: string
  quantity: number
}
