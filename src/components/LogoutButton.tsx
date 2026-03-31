'use client'

export function LogoutButton({ userName }: { userName: string }) {
  return (
    <div className="mt-6 bg-white rounded-xl border border-[#e5e3de] overflow-hidden md:hidden">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 border border-[#e5e3de] flex items-center justify-center text-lg font-bold text-gray-500">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">{userName}</p>
            <p className="text-sm text-gray-500">Sessió activa</p>
          </div>
        </div>
        <form action={async () => {
          const { logout } = await import('@/lib/auth')
          await logout()
        }}>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl border border-[#e5e3de] text-sm font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Tancar sessió
          </button>
        </form>
      </div>
    </div>
  )
}
