import { type ActiveLot, type FifoBreakdown } from '@/types/database'

export function computeFifo(lots: ActiveLot[], requested: number): FifoBreakdown[] {
  let remaining = requested
  const breakdown: FifoBreakdown[] = []
  for (const lot of lots) {
    if (remaining <= 0) break
    const take = Math.min(lot.quantity, remaining)
    breakdown.push({ batch_number: lot.batch_number, quantity: take })
    remaining -= take
  }
  return breakdown
}
