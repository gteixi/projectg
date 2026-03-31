'use client'

import { useState } from 'react'
import { PinPad } from '@/components/PinPad'

interface User {
  id: string
  name: string
}

export function LoginFlow({ users }: { users: User[] }): React.JSX.Element {
  const [selected, setSelected] = useState<User | null>(
    users.length === 1 ? users[0] : null,
  )
  const [pinPending, setPinPending] = useState(false)

  if (!selected) {
    return (
      <>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hola!</h1>
        <p className="text-base text-gray-500 mb-8">Qui ets?</p>
        <div className="w-full flex flex-col gap-3">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelected(user)}
              className="w-full h-16 rounded-xl bg-white border border-[#e5e3de] text-gray-900 text-xl font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              {user.name}
            </button>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Hola, {selected.name}
      </h1>
      <p className="text-base text-gray-500 mb-8">Introdueix el PIN</p>
      <PinPad onPendingChange={setPinPending} />
      {users.length > 1 && !pinPending && (
        <button
          onClick={() => setSelected(null)}
          className="mt-6 text-base text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Canviar usuari
        </button>
      )}
    </>
  )
}
