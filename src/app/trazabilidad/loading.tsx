import { Sidebar } from '@/components/Sidebar'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#e5e3de] px-5 py-4 flex items-center gap-3 animate-pulse">
      <span className="h-6 w-32 bg-blue-50 rounded-lg shrink-0" />
      <span className="h-5 bg-gray-200 rounded flex-1" />
      <span className="h-6 w-20 bg-gray-100 rounded-full shrink-0 hidden sm:block" />
      <span className="h-4 w-4 bg-gray-100 rounded shrink-0" />
    </div>
  )
}

export default function TrazabilidadLoading() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Lote</h1>
            <p className="text-base text-gray-500 mt-0.5 md:text-lg">Cerca per número de lot o preparació</p>
          </header>
          <div className="h-14 bg-white rounded-xl border border-[#e5e3de] mb-6 animate-pulse" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </main>
    </div>
  )
}
