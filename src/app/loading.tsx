import { Sidebar } from '@/components/Sidebar'
import { Sk } from '@/components/Skeleton'

function StationSkeleton() {
  return (
    <div className="bg-white border border-[#e5e3de] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-l-4 border-gray-200">
        <Sk className="h-5 w-24" />
        <div className="flex gap-2">
          <Sk className="h-6 w-10 rounded-full" />
          <Sk className="h-6 w-10 rounded-full" />
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden divide-y divide-[#e5e3de]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 flex flex-col gap-3">
            <Sk className="h-5 w-40" />
            <Sk className="h-4 w-24" />
            <Sk className="h-12 w-full rounded-xl" />
            <Sk className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Desktop: table rows */}
      <div className="hidden md:block px-6 pb-4 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-[#e5e3de] last:border-0">
            <Sk className="h-4 w-4 rounded-full shrink-0" />
            <Sk className="h-4 w-48" />
            <Sk className="h-4 w-12 ml-auto" />
            <Sk className="h-4 w-12" />
            <Sk className="h-4 w-12" />
            <Sk className="h-9 w-[200px] rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomeLoading() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <header className="mb-6">
            <Sk className="h-8 w-36 mb-2" />
            <Sk className="h-5 w-48" />
          </header>
          <div className="mb-6">
            <Sk className="h-12 w-full max-w-sm rounded-xl" />
          </div>
          <div className="flex flex-col gap-4 md:gap-5">
            <StationSkeleton />
            <StationSkeleton />
            <StationSkeleton />
          </div>
        </div>
      </main>
    </div>
  )
}
