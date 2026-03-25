export type Station = 'Fríos' | 'Fuegos' | 'Postres' | 'Panadería' | 'Entrantes'
export type LogType = 'opening' | 'production'
export type Role = 'chef' | 'jefe_partida' | 'cook'

export interface Preparation {
  id: string
  restaurant_id: string
  name: string
  unit: string
  par_quantity: number
  shelf_life_hours: number
  station: Station
  active: boolean
  created_at: string
}

export interface ProductionLog {
  id: string
  preparation_id: string
  profile_id: string
  type: LogType
  quantity: number
  expires_at: string | null
  logged_at: string
  notes: string | null
}

export interface StockActualHoy {
  preparation_id: string
  restaurant_id: string
  name: string
  unit: string
  par_quantity: number
  shelf_life_hours: number
  station: Station
  stock_total: number
  falta_producir: number
  proxima_caducidad: string | null
  veces_producido_hoy: number
}