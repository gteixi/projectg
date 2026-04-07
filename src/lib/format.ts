import { LOCALE, TIMEZONE, UNIT_TRUNCATE_LENGTH, UNIT_TRUNCATE_SLICE, MS_PER_DAY } from './constants'

export type ExpirySemaphore = 'red' | 'yellow' | 'green'

/** Unified expiry classification matching the urgent page logic:
 *  red = caducado, yellow = caduca hoy, green = caduca demà o més tard */
export function expirySemaphore(iso: string): ExpirySemaphore {
  const tz = { timeZone: TIMEZONE, year: 'numeric' as const, month: '2-digit' as const, day: '2-digit' as const }
  const expiresAt = new Date(iso)
  const now = new Date()
  if (expiresAt <= now) return 'red'
  if (expiresAt.toLocaleDateString(LOCALE, tz) === now.toLocaleDateString(LOCALE, tz)) return 'yellow'
  return 'green'
}

export function truncUnit(unit: string): string {
  return unit.length > UNIT_TRUNCATE_LENGTH ? unit.slice(0, UNIT_TRUNCATE_SLICE) + '.' : unit
}

export function formatExpiry(iso: string): string {
  const tz = { timeZone: TIMEZONE } as const
  const date = new Date(iso)
  const now = new Date()
  const dateDay = date.toLocaleDateString(LOCALE, { ...tz, year: 'numeric', month: '2-digit', day: '2-digit' })
  const nowDay = now.toLocaleDateString(LOCALE, { ...tz, year: 'numeric', month: '2-digit', day: '2-digit' })
  const tomorrowDay = new Date(now.getTime() + MS_PER_DAY).toLocaleDateString(LOCALE, { ...tz, year: 'numeric', month: '2-digit', day: '2-digit' })
  if (date <= now) {
    const time = date.toLocaleTimeString(LOCALE, { ...tz, hour: '2-digit', minute: '2-digit' })
    if (dateDay === nowDay) return `cad. ${time}`
    return `cad. ${date.toLocaleDateString(LOCALE, { ...tz, day: 'numeric', month: 'short' })} ${time}`
  }
  const time = date.toLocaleTimeString(LOCALE, { ...tz, hour: '2-digit', minute: '2-digit' })
  if (dateDay === nowDay) return `cad. ${time}`
  if (dateDay === tomorrowDay)
    return `cad. dem\u00e0 ${time}`
  return `cad. ${date.toLocaleDateString(LOCALE, { ...tz, day: 'numeric', month: 'short' })} ${time}`
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    timeZone: TIMEZONE,
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' })
}

export function toLocalDateStr(iso: string): string {
  const parts = new Date(iso).toLocaleDateString(LOCALE, { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).split('/')
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

export function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12)
  const label = date.toLocaleDateString(LOCALE, { timeZone: TIMEZONE, weekday: 'long', day: 'numeric', month: 'long' })
  return label.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatExpiryShort(isoDate: string): string {
  const d = new Date(isoDate)
  return d.toLocaleDateString(LOCALE, { timeZone: TIMEZONE, day: '2-digit', month: '2-digit' })
}

export function toMadridIso(dateStr: string, time: string): string {
  const wall = new Date(`${dateStr}T${time}`)
  const utcWall = new Date(wall.toLocaleString('en-US', { timeZone: 'UTC' }))
  const madridWall = new Date(wall.toLocaleString('en-US', { timeZone: TIMEZONE }))
  return new Date(wall.getTime() + (utcWall.getTime() - madridWall.getTime())).toISOString()
}

export function endOfDayInMadrid(): Date {
  const now = new Date()
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const eodLocal = new Date(`${dateStr}T23:59:59.999`)
  const utcWall = new Date(eodLocal.toLocaleString('en-US', { timeZone: 'UTC' }))
  const madridWall = new Date(eodLocal.toLocaleString('en-US', { timeZone: TIMEZONE }))
  return new Date(eodLocal.getTime() + (utcWall.getTime() - madridWall.getTime()))
}

export function formatTodayLong(): string {
  return new Date().toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
