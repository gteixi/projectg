'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function DatePicker({ value, basePath = '/informe' }: { value: string; basePath?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

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
    <input
      type="date"
      value={value}
      max={today}
      onChange={handleChange}
      className="h-12 px-4 rounded-xl border border-[#e5e3de] bg-white text-base text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
    />
  )
}
