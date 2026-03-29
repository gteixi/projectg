'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'

const SESSION_COOKIE = 'kitchen_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function loginWithPin(pin: string): Promise<{ error: string | null }> {
  if (!/^\d{4}$/.test(pin)) return { error: 'El PIN ha de ser de 4 xifres' }

  const supabase = await createServerClient()
  const pinHash = await hashPin(pin)

  const { data, error } = await supabase
    .from('kitchen_users')
    .select('id, name')
    .eq('pin_hash', pinHash)
    .eq('active', true)
    .single()

  if (error || !data) return { error: 'PIN incorrecte' }

  const session = JSON.stringify({ userId: data.id, name: data.name })
  const encoded = Buffer.from(session).toString('base64')

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })

  return { error: null }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect('/login')
}

export async function getSession(): Promise<{ userId: string; name: string } | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(SESSION_COOKIE)
  if (!cookie?.value) return null

  try {
    const decoded = Buffer.from(cookie.value, 'base64').toString('utf-8')
    const session = JSON.parse(decoded) as { userId: string; name: string }
    if (session.userId && session.name) return session
    return null
  } catch {
    return null
  }
}
