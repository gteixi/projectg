import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { PinPad } from '@/components/PinPad'

export default async function LoginPage(): Promise<React.JSX.Element> {
  const session = await getSession()
  if (session) redirect('/')

  const supabase = await createServerClient()
  const { data } = await supabase
    .from('kitchen_users')
    .select('name')
    .eq('active', true)
    .limit(1)
    .single()

  const userName = data?.name ?? 'ProjectG'

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4">
      <div className="w-full max-w-xs flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hola, {userName}</h1>
        <p className="text-base text-gray-500 mb-8">Introdueix el PIN</p>
        <PinPad />
      </div>
    </div>
  )
}
