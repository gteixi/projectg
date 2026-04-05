'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'Buscar producció…', className = '' }: Props) {
  const [local, setLocal] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => { setLocal(value) }, [value])

  function handleChange(v: string) {
    setLocal(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(v), 200)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#e5e3de] bg-white text-sm md:text-base text-gray-900 overflow-hidden text-ellipsis placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  )
}
