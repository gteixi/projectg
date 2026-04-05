'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHmac } from 'crypto'
import { createServerClient } from '@/lib/supabase'
import { pinSchema } from '@/lib/validation'

const SESSION_COOKIE = 'kitchen_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const MAX_LOGIN_ATTEMPTS = 10
const RATE_LIMIT_WINDOW_MINUTES = 15

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET env var is required')
  return secret
}

function signPayload(payload: string): string {
  const sig = createHmac('sha256', getSecret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

function verifyPayload(token: string): string | null {
  const idx = token.lastIndexOf('.')
  if (idx < 0) return null
  const payload = token.slice(0, idx)
  const sig = token.slice(idx + 1)
  const expected = createHmac('sha256', getSecret()).update(payload).digest('base64url')
  if (sig !== expected) return null
  return payload
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function getIpHash(): Promise<string> {
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? hdrs.get('x-real-ip') ?? 'unknown'
  const encoder = new TextEncoder()
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(ip))
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function checkLoginRateLimit(supabase: Awaited<ReturnType<typeof createServerClient>>): Promise<string | null> {
  const ipHash = await getIpHash()
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString()

  const { count } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('attempted_at', windowStart)

  if (count !== null && count >= MAX_LOGIN_ATTEMPTS) {
    return `Massa intents de login. Espera ${RATE_LIMIT_WINDOW_MINUTES} minuts.`
  }
  return null
}

async function recordLoginAttempt(supabase: Awaited<ReturnType<typeof createServerClient>>): Promise<void> {
  const ipHash = await getIpHash()
  await supabase.from('login_attempts').insert({ ip_hash: ipHash })
  // Cleanup old attempts periodically (1 in 10 chance)
  if (Math.random() < 0.1) {
    try { await supabase.rpc('cleanup_old_login_attempts') } catch { /* ignore */ }
  }
}

export async function loginWithPin(pin: string): Promise<{ error: string | null }> {
  const parsed = pinSchema.safeParse({ pin })
  if (!parsed.success) return { error: 'El PIN ha de ser de 4 xifres' }

  const supabase = await createServerClient()

  const rateLimitError = await checkLoginRateLimit(supabase)
  if (rateLimitError) return { error: rateLimitError }

  await recordLoginAttempt(supabase)

  const pinHash = await hashPin(parsed.data.pin)

  const { data, error } = await supabase
    .from('kitchen_users')
    .select('id, name')
    .eq('pin_hash', pinHash)
    .eq('active', true)
    .single()

  if (error || !data) return { error: 'PIN incorrecte' }

  const exp = Date.now() + SESSION_MAX_AGE * 1000
  const session = JSON.stringify({ userId: data.id, name: data.name, exp })
  const encoded = signPayload(Buffer.from(session).toString('base64'))

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
    const payload = verifyPayload(cookie.value)
    if (!payload) return null
    const decoded = Buffer.from(payload, 'base64').toString('utf-8')
    const session = JSON.parse(decoded) as { userId: string; name: string; exp?: number }
    if (!session.userId || !session.name) return null
    if (session.exp && Date.now() > session.exp) {
      try { cookieStore.delete(SESSION_COOKIE) } catch { /* read-only context */ }
      return null
    }
    return { userId: session.userId, name: session.name }
  } catch {
    return null
  }
}
