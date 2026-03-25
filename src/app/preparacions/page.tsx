import { createServerClient } from '@/lib/supabase'
import { Preparation } from '@/types/database'
import { Sidebar } from '@/components/Sidebar'
import { PrepManager } from './PrepManager'

const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111'

export default async function PreparacionsPage() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('preparations')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('active', true)
    .order('name')

  if (error) {
    return <pre className="p-8 text-red-500">{JSON.stringify(error, null, 2)}</pre>
  }

  const preparations = (data ?? []) as Preparation[]

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="md:ml-[120px] flex-1 min-h-screen bg-[#f8f7f4] pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <PrepManager preparations={preparations} />
        </div>
      </main>
    </div>
  )
}
