import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { LoginFlow } from '@/components/LoginFlow'

export default async function LoginPage(): Promise<React.JSX.Element> {
  const session = await getSession()
  if (session) redirect('/')

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('kitchen_users')
    .select('id, name')
    .eq('active', true)
    .order('name')

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4">
        <p className="text-red-600 text-lg">Error carregant usuaris: {error.message}</p>
      </div>
    )
  }

  const users = (data ?? []).map((u) => ({ id: u.id, name: u.name }))

  if (users.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4">
        <p className="text-red-600 text-lg">No s&#39;han trobat usuaris actius</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4">
      <div className="w-full max-w-xs flex flex-col items-center">
        <LoginFlow users={users} />
      </div>
    </div>
  )
}
