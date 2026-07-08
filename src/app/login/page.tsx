import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { LoginFlow } from '@/components/LoginFlow'
import Image from 'next/image'

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
    <div className="h-dvh overflow-hidden bg-[#f8f7f4] md:flex">
      <div className="fixed inset-0 md:hidden">
        <Image
          src="/images/pitarroja.jpg"
          alt="Restaurant Pitarroja"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="hidden md:block relative w-1/2 h-dvh">
        <Image
          src="/images/pitarroja.jpg"
          alt="Restaurant Pitarroja"
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
      </div>

      <div className="relative z-10 h-dvh flex items-center justify-center px-4 py-4 md:flex-1 md:py-0">
        <div className="w-full max-w-xs flex flex-col items-center bg-white/95 backdrop-blur-sm rounded-2xl p-5 md:bg-transparent md:backdrop-blur-none md:rounded-none md:p-0">
          <LoginFlow users={users} />
        </div>
      </div>
    </div>
  )
}
