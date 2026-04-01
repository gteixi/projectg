'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'


function UrgentIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function AddIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

function LoteIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
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

function UrgentBadge({ count }: { count: number }) {
  return (
    <span className="relative">
      <UrgentIcon />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-2.5 min-w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1 leading-none">
          {count}
        </span>
      )}
    </span>
  )
}

function LogoutButton() {
  return (
    <form action={async () => {
      const { logout } = await import('@/lib/auth')
      await logout()
    }}>
      <button
        type="submit"
        className="flex flex-col items-center justify-center gap-2 w-full py-4 px-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-gray-800/60 transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span className="text-xs font-semibold leading-none">Sortir</span>
      </button>
    </form>
  )
}


export function Sidebar({ urgentCount = 0 }: { urgentCount?: number }) {
  const pathname = usePathname()
  const isUrgent = pathname.startsWith('/urgent')
  const isAfegir = pathname.startsWith('/afegir')
  const isHistorial = pathname.startsWith('/historial')
  const isTrazabilidad = pathname.startsWith('/trazabilidad')
  const isInforme = pathname.startsWith('/informe')

  return (
    <>
      {/* Desktop/tablet sidebar — left */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[120px] bg-gray-900 flex-col items-center pt-6 pb-4 z-20 gap-2 px-3">
        <NavItem href="/urgent" icon={<UrgentBadge count={urgentCount} />} label="Urgent" active={isUrgent} />
        <NavItem href="/afegir" icon={<AddIcon />} label="Afegir" active={isAfegir} />
        <NavItem href="/trazabilidad" icon={<LoteIcon />} label="Lote" active={isTrazabilidad} />
        <NavItem href="/historial" icon={<CalendarIcon />} label="Historial" active={isHistorial} />
        <NavItem href="/informe" icon={<ChartIcon />} label="Informe" active={isInforme} />
        <div className="mt-auto" />
        <LogoutButton />
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gray-900/95 backdrop-blur-md flex items-center z-50 border-t border-white/[0.06] transform-gpu">
        <MobileNavItem href="/urgent" icon={<UrgentBadge count={urgentCount} />} label="Urgent" active={isUrgent} />
        <MobileNavItem href="/trazabilidad" icon={<LoteIcon />} label="Lote" active={isTrazabilidad} />
        {/* Center FAB — Afegir */}
        <div className="flex-1 flex justify-center">
          <Link
            href="/afegir"
            className="flex flex-col items-center -mt-7"
          >
            <span className={`flex items-center justify-center w-14 h-14 rounded-full border border-white/[0.08] transition-all duration-200 ${
              isAfegir
                ? 'bg-gray-800 text-white shadow-[0_4px_12px_rgba(0,0,0,0.4)]'
                : 'bg-gray-800 text-gray-400 shadow-[0_4px_12px_rgba(0,0,0,0.4)]'
            }`}>
              <AddIcon />
            </span>
            <span className={`text-[10px] font-semibold mt-1.5 transition-colors duration-200 ${
              isAfegir ? 'text-white' : 'text-gray-400'
            }`}>Afegir</span>
          </Link>
        </div>
        <MobileNavItem href="/historial" icon={<CalendarIcon />} label="Historial" active={isHistorial} />
        <MobileNavItem href="/informe" icon={<ChartIcon />} label="Informe" active={isInforme} />
      </nav>
    </>
  )
}
