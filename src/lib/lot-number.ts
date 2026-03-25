import { createClient } from '@/lib/supabase-browser'

function todayDateStr(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

export async function generateLotNumber(): Promise<string> {
  const dateStr = todayDateStr()
  const prefix = `LOT-${dateStr}-`
  const supabase = createClient()
  const { count } = await supabase
    .from('production_logs')
    .select('id', { count: 'exact', head: true })
    .like('batch_number', `${prefix}%`)
  const next = ((count ?? 0) + 1).toString().padStart(3, '0')
  return `${prefix}${next}`
}
