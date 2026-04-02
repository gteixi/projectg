import { type SupabaseClient } from '@supabase/supabase-js'

/**
 * Fetch exited quantities for a set of batch numbers, scoped by tenant.
 * Returns a Map<batch_number, total_exited_quantity>.
 */
export async function fetchExitedByBatch(
  supabase: SupabaseClient,
  kitchenUserId: string,
  batchNumbers: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (batchNumbers.length === 0) return map

  const { data } = await supabase
    .from('stock_exit_lots')
    .select('batch_number, quantity')
    .eq('kitchen_user_id', kitchenUserId)
    .in('batch_number', batchNumbers)

  for (const row of data ?? []) {
    const bn = String(row.batch_number)
    map.set(bn, (map.get(bn) ?? 0) + Number(row.quantity))
  }
  return map
}
