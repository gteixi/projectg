'use client'

import { useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function DatePicker({ value, basePath = '/informe' }: { value: string; basePath?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().slice(0, 10)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value && e.target.value !== today) {
      params.set('dia', e.target.value)
    } else {
      params.delete('dia')
    }
    const qs = params.toString()
    router.push(qs ? `${basePath}?${qs}` : basePath)
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.showPicker()}
      className="relative flex items-center gap-2 h-12 px-4 rounded-xl border border-[#e5e3de] bg-white text-base text-gray-900 font-medium active:bg-gray-50"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-gray-500">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span>{value}</span>
      <input
        ref={inputRef}
        type="date"
        value={value}
        max={today}
        onChange={handleChange}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
      />
    </button>
  )
}
