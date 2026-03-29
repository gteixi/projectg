import { Sidebar } from '@/components/Sidebar'
import { Sk } from '@/components/Skeleton'

export default function UrgentLoading() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <header className="mb-6">
            <Sk className="h-8 w-28 mb-2" />
          </header>
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                <Sk className="w-3 h-3 rounded-full shrink-0" />
                <Sk className="h-4 flex-1 max-w-[180px]" />
                <Sk className="h-4 w-20 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
