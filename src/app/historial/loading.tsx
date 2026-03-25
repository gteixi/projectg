import { Sidebar } from '@/components/Sidebar'

function SkeletonRow() {
  return (
    <li className="grid items-center gap-x-3 px-4 py-3 md:px-6 animate-pulse" style={{ gridTemplateColumns: 'auto 1fr auto auto' }}>
      <span className="w-3 h-3 rounded-full bg-gray-200" />
      <span className="h-4 bg-gray-200 rounded w-32" />
      <span className="h-5 bg-gray-100 rounded-full w-12" />
      <span className="h-4 bg-gray-200 rounded w-24" />
    </li>
  )
}

function SkeletonDay() {
  return (
    <div className="bg-white rounded-xl border border-[#e5e3de] overflow-hidden animate-pulse">
      <div className="px-4 py-3 border-b border-[#e5e3de] md:px-6 flex items-center justify-between">
        <div className="h-5 bg-gray-200 rounded w-40" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-100 rounded-full w-16" />
          <div className="h-6 bg-gray-100 rounded-full w-16" />
        </div>
      </div>
      <ul className="divide-y divide-[#e5e3de]">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </ul>
    </div>
  )
}

export default function HistorialLoading() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Historial</h1>
            <p className="text-base text-gray-500 mt-0.5 md:text-lg">Últims 7 dies</p>
          </header>
          <div className="flex flex-col gap-4 md:gap-5">
            <SkeletonDay />
            <SkeletonDay />
            <SkeletonDay />
          </div>
        </div>
      </main>
    </div>
  )
}
