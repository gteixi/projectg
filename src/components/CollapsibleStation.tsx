'use client'

import { useState } from 'react'

interface Props {
  accentBorder: string
  accentBg: string
  accentText: string
  title: string
  headerRight: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CollapsibleStation({
  accentBorder,
  accentBg,
  accentText,
  title,
  headerRight,
  children,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      className={`bg-white rounded-xl border border-[#e5e3de] border-l-4 ${accentBorder} overflow-hidden`}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-5 py-5 flex items-center justify-between ${accentBg} transition-colors ${
          open ? 'border-b border-[#e5e3de]' : ''
        }`}
      >
        <h2 className={`text-xl font-bold tracking-tight ${accentText}`}>{title}</h2>
        <div className="flex items-center gap-2">
          {headerRight}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`ml-1 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="5 8 10 13 15 8" />
          </svg>
        </div>
      </button>
      {open && children}
    </section>
  )
}
