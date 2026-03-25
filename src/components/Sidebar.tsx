'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

function ListIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IngredientsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.6 2.8-1.5 3.8L20 21H4l5.5-11.2A5 5 0 0 1 8 6a4 4 0 0 1 4-4z" />
      <line x1="12" y1="6" x2="12" y2="10" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function TraceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function TeamIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-2 w-full py-4 px-2 rounded-xl transition-colors ${
        active
          ? 'bg-gray-800 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
      }`}
    >
      {icon}
      <span className="text-xs font-semibold leading-none text-center">{label}</span>
    </Link>
  )
}

function MobileNavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-colors ${
        active ? 'text-white' : 'text-gray-400'
      }`}
    >
      {icon}
      <span className="text-xs font-semibold leading-none">{label}</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { activeUser, logout } = useAuth()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const router = useRouter()
  const isPreparaciones = pathname.startsWith('/preparacions')
  const isHistorial = pathname.startsWith('/historial')
  const isTrazabilidad = pathname.startsWith('/trazabilidad')
  const isEquip = pathname.startsWith('/equipo')
  const isAvui = !isPreparaciones && !isHistorial && !isTrazabilidad && !isEquip

  return (
    <>
      {/* Mobile logout confirm overlay */}
      {confirmLogout && (
        <div className="fixed inset-0 z-30 flex items-end justify-center pb-20 md:items-center md:pb-0">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmLogout(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm mx-4 px-6 py-6 flex flex-col gap-4 shadow-lg">
            <p className="text-xl font-semibold text-gray-900 text-center">
              Vols tancar la sessió?
            </p>
            <p className="text-base text-gray-500 text-center -mt-2">
              {activeUser.name}
            </p>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 h-14 rounded-xl border border-[#e5e3de] text-base font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel·lar
              </button>
              <button
                onClick={() => { setConfirmLogout(false); router.push('/equipo') }}
                className="md:hidden flex-1 h-14 rounded-xl bg-gray-800 text-white text-base font-semibold hover:bg-gray-700"
              >
                Equip
              </button>
              <button
                onClick={logout}
                className="flex-1 h-14 rounded-xl bg-red-600 text-white text-base font-semibold hover:bg-red-700"
              >
                Tancar sessió
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop/tablet sidebar — left */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[120px] bg-gray-900 flex-col items-center pt-6 pb-4 z-20 gap-2 px-3">
        <NavItem href="/" icon={<ListIcon />} label="Avui" active={isAvui} />
        <NavItem href="/preparacions" icon={<IngredientsIcon />} label="Preparacions" active={isPreparaciones} />
        <NavItem href="/historial" icon={<CalendarIcon />} label="Historial" active={isHistorial} />
        <NavItem href="/trazabilidad" icon={<TraceIcon />} label="Lote" active={isTrazabilidad} />
        <NavItem href="/equipo" icon={<TeamIcon />} label="Equip" active={isEquip} />
        <div className="mt-auto flex flex-col items-center gap-1.5 w-full">
          <span className="text-xs font-semibold text-gray-300 text-center leading-tight px-1 truncate w-full text-center">
            {activeUser.name}
          </span>
          <button
            onClick={() => setConfirmLogout(true)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
          >
            Canviar
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gray-900 flex items-center z-50 border-t border-gray-800 transform-gpu">
        <MobileNavItem href="/" icon={<ListIcon />} label="Avui" active={isAvui} />
        <MobileNavItem href="/preparacions" icon={<IngredientsIcon />} label="Preparacions" active={isPreparaciones} />
        <MobileNavItem href="/historial" icon={<CalendarIcon />} label="Historial" active={isHistorial} />
        <MobileNavItem href="/trazabilidad" icon={<TraceIcon />} label="Lote" active={isTrazabilidad} />
        <div className="w-px self-stretch bg-gray-800 mx-1 shrink-0" />
        <button
          onClick={() => setConfirmLogout(true)}
          className="flex flex-col items-center justify-center gap-1 px-3 h-full shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold leading-none">
            {activeUser.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <span className="text-[10px] font-semibold text-gray-400 leading-none max-w-[60px] truncate">{activeUser.name.split(' ')[0]}</span>
        </button>
      </nav>
    </>
  )
}
