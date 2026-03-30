'use client'

import { useState, useTransition, useEffect } from 'react'
import { getActiveLots, createSaleExit } from '@/lib/sale-actions'
import { SaleConfirmModal } from './SaleConfirmModal'
import { type ActiveLot, type FifoBreakdown, type SaleReason } from '@/types/database'
import { truncUnit } from '@/lib/format'
import { useToast } from '@/components/Toast'
import { SALE_REASONS, FIFO_TOLERANCE, FIFO_ROUNDING_FACTOR } from '@/lib/constants'
import { ManualLotPicker } from './ManualLotPicker'
import { computeFifo } from '@/lib/fifo'

interface Props {
  productionId: string
  unit: string
  stock: number
  initialLots?: ActiveLot[]
  onClose: () => void
  onSuccess?: (quantity: number) => void
}

export function SalePanel({ productionId, unit, stock, initialLots, onClose, onSuccess }: Props): React.JSX.Element {
  const { showToast } = useToast()
  const [step, setStep] = useState<'input' | 'confirm'>('input')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState<SaleReason>('merma')
  const [lots, setLots] = useState<ActiveLot[]>(initialLots ?? [])
  const [lotsLoading, setLotsLoading] = useState(!initialLots)
  const [lotsError, setLotsError] = useState<string | null>(null)
  const [breakdown, setBreakdown] = useState<FifoBreakdown[]>([])
  const [inputError, setInputError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [manualMode, setManualMode] = useState(false)
  const [manualQty, setManualQty] = useState<Record<number, string>>({})

  useEffect(() => {
    if (initialLots) return
    getActiveLots(productionId).then(({ lots: l, error }) => {
      setLotsLoading(false)
      if (error) setLotsError(error)
      else setLots(l)
    })
  }, [productionId, initialLots])

  function handleToggleManual(enabled: boolean) {
    setManualMode(enabled)
    setInputError(null)
    if (enabled) {
      const qty = parseFloat(quantity)
      const fifo = isNaN(qty) || qty <= 0 ? [] : computeFifo(lots, Math.min(qty, lots.reduce((s, l) => s + l.quantity, 0)))
      const init: Record<number, string> = {}
      for (const lot of lots) {
        const suggestion = fifo.find((f) => f.batch_number === lot.batch_number)
        init[lot.batch_number] = suggestion ? String(suggestion.quantity) : '0'
      }
      setManualQty(init)
    }
  }

  function handleCalculate() {
    setInputError(null)
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      setInputError('Introdueix una quantitat vàlida')
      return
    }
    if (qty > stock) {
      setInputError(`Stock insuficient (màx. ${stock} ${truncUnit(unit)})`)
      return
    }
    const totalAvailable = lots.reduce((s, l) => s + l.quantity, 0)
    if (qty > totalAvailable) {
      setInputError(`Només ${totalAvailable} ${truncUnit(unit)} en lots actius avui`)
      return
    }

    if (manualMode) {
      const entries = lots.map((lot) => ({
        batch_number: lot.batch_number,
        quantity: parseFloat(manualQty[lot.batch_number] ?? '0') || 0,
      })).filter((e) => e.quantity > 0)

      const manualTotal = entries.reduce((s, e) => s + e.quantity, 0)
      const rounded = Math.round(manualTotal * FIFO_ROUNDING_FACTOR) / FIFO_ROUNDING_FACTOR
      if (Math.abs(rounded - qty) > FIFO_TOLERANCE) {
        setInputError(`El total manual (${rounded}) ha de ser igual a ${qty} ${truncUnit(unit)}`)
        return
      }
      for (const lot of lots) {
        const take = parseFloat(manualQty[lot.batch_number] ?? '0') || 0
        if (take > lot.quantity) {
          setInputError(`Lot ${lot.batch_number}: màx. ${lot.quantity} ${truncUnit(unit)} disponibles`)
          return
        }
      }
      setBreakdown(entries)
    } else {
      setBreakdown(computeFifo(lots, qty))
    }
    setStep('confirm')
  }

  function handleSubmit(): void {
    const qty = parseFloat(quantity)
    startTransition(async () => {
      const result = await createSaleExit(productionId, qty, reason, breakdown)
      if (result.error) {
        showToast(`Error registrant sortida: ${result.error}`)
      } else {
        onSuccess?.(qty)
      }
    })
  }

  const unitLabel = truncUnit(unit)
  const reasonLabel = SALE_REASONS.find((r) => r.value === reason)?.label ?? ''

  function handleCorrect(): void {
    setStep('input')
    setServerError(null)
  }

  const modal = step === 'confirm' ? (
    <SaleConfirmModal
      quantity={quantity}
      unitLabel={unitLabel}
      reasonLabel={reasonLabel}
      breakdown={breakdown}
      serverError={serverError}
      pending={pending}
      onCorrect={handleCorrect}
      onSubmit={handleSubmit}
    />
  ) : null

  return (
    <div className="flex flex-col gap-3">
      {modal}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0.1"
          step="0.1"
          placeholder="Quantitat"
          value={quantity}
          onChange={(e) => { setQuantity(e.target.value); setInputError(null) }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCalculate(); if (e.key === 'Escape') onClose() }}
          autoFocus
          disabled={pending}
          className="w-24 md:w-32 h-14 text-left text-lg border border-red-300 rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 bg-white shrink-0 overflow-hidden text-ellipsis placeholder:text-gray-400"
        />
        <span className="text-base text-gray-400 w-10 shrink-0">{unitLabel}</span>
        <div className="flex-1 flex gap-1.5">
          {SALE_REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              disabled={pending}
              className={`flex-1 h-14 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
                reason === r.value
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'border-[#e5e3de] text-gray-600 hover:bg-red-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {lotsError && <span className="text-sm text-red-600">{lotsError}</span>}
      {!lotsLoading && !lotsError && lots.length === 0 && (
        <span className="text-sm text-gray-400">Cap lot actiu avui</span>
      )}

      {!lotsLoading && !lotsError && lots.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleManual(false)}
              disabled={pending}
              className={`flex-1 h-10 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
                !manualMode ? 'bg-gray-800 border-gray-800 text-white' : 'border-[#e5e3de] text-gray-500 hover:bg-gray-50'
              }`}
            >
              FIFO automàtic
            </button>
            <button
              onClick={() => handleToggleManual(true)}
              disabled={pending}
              className={`flex-1 h-10 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
                manualMode ? 'bg-gray-800 border-gray-800 text-white' : 'border-[#e5e3de] text-gray-500 hover:bg-gray-50'
              }`}
            >
              Escollir lot
            </button>
          </div>

          {manualMode && (
            <ManualLotPicker
              lots={lots}
              unit={unit}
              quantity={quantity}
              manualQty={manualQty}
              onManualQtyChange={(batchNumber, value) => {
                setManualQty((prev) => ({ ...prev, [batchNumber]: value }))
                setInputError(null)
              }}
              pending={pending}
            />
          )}
        </div>
      )}

      {inputError && <span className="text-sm text-red-600">{inputError}</span>}
      <button
        onClick={handleCalculate}
        disabled={lotsLoading || pending}
        className="w-full h-14 rounded-xl border border-red-600 text-red-600 text-base font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        Sale
      </button>
    </div>
  )
}
