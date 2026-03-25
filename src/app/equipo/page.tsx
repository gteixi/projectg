'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Sidebar } from '@/components/Sidebar'
import { KitchenUser } from '@/types/database'

const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111'

function PersonPlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="16" y1="11" x2="22" y2="11" />
    </svg>
  )
}

export default function EquipoPage() {
  const [users, setUsers] = useState<KitchenUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addName, setAddName] = useState('')
  const [addPin, setAddPin] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [addPending, setAddPending] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const [changePinId, setChangePinId] = useState<string | null>(null)
  const [newPin, setNewPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinPending, setPinPending] = useState(false)

  async function loadUsers() {
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('kitchen_users')
      .select('id, restaurant_id, name, active, created_at')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('active', true)
      .order('name')
    if (err) setError(err.message)
    setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  async function handleAdd() {
    const name = addName.trim()
    if (!name) { setAddError('Cal introduir un nom'); return }
    if (!/^\d{4}$/.test(addPin)) { setAddError('El PIN ha de tenir exactament 4 dígits'); return }

    setAddPending(true)
    setAddError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from('kitchen_users').insert({
      restaurant_id: RESTAURANT_ID,
      name,
      pin: addPin,
      active: true,
    })
    setAddPending(false)
    if (err) { setAddError(err.message); return }
    setAddName('')
    setAddPin('')
    setShowAddForm(false)
    loadUsers()
  }

  async function handleChangePin(userId: string) {
    if (!/^\d{4}$/.test(newPin)) { setPinError('El PIN ha de tenir exactament 4 dígits'); return }

    setPinPending(true)
    setPinError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('kitchen_users')
      .update({ pin: newPin })
      .eq('id', userId)
    setPinPending(false)
    if (err) { setPinError(err.message); return }
    setChangePinId(null)
    setNewPin('')
  }

  async function handleDeactivate(userId: string) {
    const supabase = createClient()
    const { error: err } = await supabase
      .from('kitchen_users')
      .update({ active: false })
      .eq('id', userId)
    if (err) { setError(err.message); return }
    loadUsers()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Equip</h1>
              <p className="text-base text-gray-500 mt-0.5 md:text-lg">Gestiona els cocineros del restaurant</p>
            </div>
            <button
              onClick={() => { setShowAddForm((v) => !v); setAddError(null) }}
              className="flex items-center gap-2 h-12 px-5 rounded-xl bg-gray-900 text-white text-base font-semibold hover:bg-gray-700 transition-colors"
            >
              <PersonPlusIcon />
              <span className="hidden sm:inline">Nou cocinero</span>
            </button>
          </header>

          {showAddForm && (
            <div className="bg-white rounded-xl border border-[#e5e3de] px-5 py-5 mb-5 flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Afegir cocinero</h2>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">Nom</label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Nom del cocinero"
                    className="h-14 px-4 text-lg border border-[#e5e3de] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">PIN (4 dígits)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={addPin}
                    onChange={(e) => setAddPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1234"
                    className="h-14 w-32 px-4 text-xl font-mono text-center border border-[#e5e3de] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400 placeholder:font-sans"
                  />
                </div>
              </div>
              {addError && <p className="text-red-600 text-sm">{addError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  disabled={addPending}
                  className="h-14 px-6 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {addPending ? 'Guardant…' : 'Afegir'}
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setAddError(null); setAddName(''); setAddPin('') }}
                  className="h-14 px-6 rounded-xl border border-[#e5e3de] text-base font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel·lar
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-base mb-4">{error}</p>}

          {loading && (
            <p className="text-center text-gray-400 text-base py-12">Carregant…</p>
          )}

          {!loading && users.length === 0 && (
            <div className="bg-white rounded-xl border border-[#e5e3de] px-6 py-10 text-center">
              <p className="text-gray-400 text-lg">Cap cocinero registrat</p>
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className="flex flex-col gap-3">
              {users.map((user) => (
                <div key={user.id} className="bg-white rounded-xl border border-[#e5e3de] px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xl font-semibold text-gray-900">{user.name}</span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setChangePinId(changePinId === user.id ? null : user.id)
                          setNewPin('')
                          setPinError(null)
                        }}
                        className="h-12 px-4 rounded-xl border border-[#e5e3de] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Canviar PIN
                      </button>
                      <button
                        onClick={() => handleDeactivate(user.id)}
                        className="h-12 px-4 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Desactivar
                      </button>
                    </div>
                  </div>
                  {changePinId === user.id && (
                    <div className="mt-4 flex flex-col gap-3 pt-4 border-t border-[#e5e3de]">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-600 shrink-0">Nou PIN</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="1234"
                          autoFocus
                          className="h-12 w-28 px-4 text-xl font-mono text-center border border-[#e5e3de] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400 placeholder:font-sans"
                        />
                        <button
                          onClick={() => handleChangePin(user.id)}
                          disabled={pinPending}
                          className="h-12 px-5 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {pinPending ? '…' : 'Guardar'}
                        </button>
                        <button
                          onClick={() => { setChangePinId(null); setNewPin(''); setPinError(null) }}
                          className="h-12 px-4 rounded-xl border border-[#e5e3de] text-base font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      {pinError && <p className="text-red-600 text-sm">{pinError}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
