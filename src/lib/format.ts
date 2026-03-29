import { LOCALE, UNIT_TRUNCATE_LENGTH, UNIT_TRUNCATE_SLICE, MS_PER_DAY } from './constants'

export function truncUnit(unit: string): string {
  return unit.length > UNIT_TRUNCATE_LENGTH ? unit.slice(0, UNIT_TRUNCATE_SLICE) + '.' : unit
}

export function formatExpiry(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const time = date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
  if (date.toDateString() === now.toDateString()) return `cad. ${time}`
  if (date.toDateString() === new Date(now.getTime() + MS_PER_DAY).toDateString())
    return `cad. dem\u00e0 ${time}`
  return `cad. ${date.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })} ${time}`
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}

export function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const label = date.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })
  return label.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatExpiryShort(isoDate: string): string {
  const d = new Date(isoDate)
  return d.toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit' })
}

export function formatTodayLong(): string {
  return new Date().toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
