'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
  const isPreparaciones = pathname.startsWith('/preparacions')

  return (
    <>
      {/* Desktop/tablet sidebar — left */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[120px] bg-gray-900 flex-col items-center pt-6 pb-6 z-20 gap-2 px-3">
        <NavItem href="/" icon={<ListIcon />} label="Avui" active={!isPreparaciones} />
        <NavItem href="/preparacions" icon={<IngredientsIcon />} label="Preparacions" active={isPreparaciones} />
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gray-900 flex items-center justify-around z-20 px-4 border-t border-gray-800">
        <MobileNavItem href="/" icon={<ListIcon />} label="Avui" active={!isPreparaciones} />
        <MobileNavItem href="/preparacions" icon={<IngredientsIcon />} label="Preparacions" active={isPreparaciones} />
      </nav>
    </>
  )
}
