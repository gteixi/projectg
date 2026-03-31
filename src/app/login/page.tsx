import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { LoginFlow } from '@/components/LoginFlow'

export default async function LoginPage(): Promise<React.JSX.Element> {
  const session = await getSession()
  if (session) redirect('/')

  const supabase = await createServerClient()
  const { data } = await supabase
    .from('kitchen_users')
    .select('id, name')
    .eq('active', true)
    .order('name')

  const users = (data ?? []).map((u) => ({ id: u.id, name: u.name }))

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4">
      <div className="w-full max-w-xs flex flex-col items-center">
        <LoginFlow users={users} />
      </div>
    </div>
  )
}
