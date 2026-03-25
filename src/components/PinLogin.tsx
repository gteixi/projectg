'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { KitchenUser } from '@/types/database'

const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111'

interface Props {
  onLogin: (user: KitchenUser) => void
}

export function PinLogin({ onLogin }: Props) {
  const [users, setUsers] = useState<KitchenUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<KitchenUser | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    async function loadUsers() {
      const supabase = createClient()
      const { data } = await supabase
        .from('kitchen_users')
        .select('id, restaurant_id, name, active, created_at')
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('active', true)
        .order('name')
      setUsers(data ?? [])
      setLoading(false)
    }
    loadUsers()
  }, [])

  async function handleDigit(digit: string) {
    if (pin.length >= 4 || verifying) return
    const newPin = pin + digit
    setPin(newPin)
    setError(null)

    if (newPin.length === 4) {
      setVerifying(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('kitchen_users')
        .select('id, restaurant_id, name, active, created_at')
        .eq('id', selected!.id)
        .eq('pin', newPin)
        .eq('active', true)
        .single()

      if (data) {
        onLogin(data as KitchenUser)
      } else {
        setError('PIN incorrecte')
        setPin('')
      }
      setVerifying(false)
    }
  }

  function handleBack() {
    setPin((p) => p.slice(0, -1))
    setError(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <p className="text-gray-400 text-xl">Carregant…</p>
      </div>
    )
  }

  if (selected) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex flex-col items-center justify-center px-4 gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">{selected.name}</h1>
          <p className="text-lg text-gray-500 mt-1">Introdueix el teu PIN</p>
        </div>

        <div className="flex gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full border-2 transition-colors ${
                pin.length > i
                  ? 'bg-gray-900 border-gray-900'
                  : 'border-gray-400 bg-transparent'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-600 text-lg font-semibold -mt-2">{error}</p>
        )}

        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              disabled={verifying}
              className="h-20 rounded-xl bg-white border border-[#e5e3de] text-3xl font-semibold text-gray-900 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => { setSelected(null); setPin(''); setError(null) }}
            className="h-20 rounded-xl bg-gray-100 border border-[#e5e3de] text-sm font-semibold text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Enrere
          </button>
          <button
            onClick={() => handleDigit('0')}
            disabled={verifying}
            className="h-20 rounded-xl bg-white border border-[#e5e3de] text-3xl font-semibold text-gray-900 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            0
          </button>
          <button
            onClick={handleBack}
            disabled={verifying || pin.length === 0}
            className="h-20 rounded-xl bg-gray-100 border border-[#e5e3de] text-2xl text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition-colors"
          >
            ⌫
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col items-center justify-center px-4 gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">PrepList Pro</h1>
        <p className="text-lg text-gray-500 mt-1">Selecciona el teu usuari</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => setSelected(user)}
            className="h-20 rounded-xl bg-white border border-[#e5e3de] text-2xl font-semibold text-gray-900 hover:bg-gray-50 active:bg-gray-100 px-6 text-left transition-colors"
          >
            {user.name}
          </button>
        ))}
        {users.length === 0 && (
          <p className="text-center text-gray-400 text-lg py-8">
            Cap usuari registrat
          </p>
        )}
      </div>
    </div>
  )
}
