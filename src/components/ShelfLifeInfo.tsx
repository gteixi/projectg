'use client'

import { useState } from 'react'

function formatShelfLife(hours: number): string {
  if (hours >= 24) {
    const days = Math.round(hours / 24)
    return `${days} ${days === 1 ? 'dia' : 'dies'}`
  }
  return `${hours}h`
}

export function ShelfLifeInfo({ hours, onToggle, onEdit }: { hours: number; onToggle?: (open: boolean) => void; onEdit?: () => void }): React.JSX.Element {
  const [open, setOpen] = useState(false)

  function toggle() {
    const next = !open
    setOpen(next)
    onToggle?.(next)
  }

  return (
    <>
      <button
        onClick={toggle}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
          open ? 'text-blue-500 bg-blue-50' : 'text-gray-300 hover:text-blue-500 hover:bg-blue-50'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>
      {open && (
        <div className="basis-full h-0" aria-hidden="true" />
      )}
      {open && (
        <div className="basis-full text-sm text-gray-500">
          Caducitat: <span className="font-semibold text-gray-700">{formatShelfLife(hours)}</span>
          {onEdit && (
            <>
              <span className="mx-1.5 text-gray-300">·</span>
              <button onClick={onEdit} className="font-semibold text-blue-500 hover:text-blue-700 transition-colors">
                Editar producció
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
