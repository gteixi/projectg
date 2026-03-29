import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export async function requireAuth(): Promise<{ userId: string; name: string }> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}
