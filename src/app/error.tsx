'use client'

import { Sidebar } from '@/components/Sidebar'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7 flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Alguna cosa ha fallat</h1>
          <p className="text-base text-gray-500 mb-6">{error.message}</p>
          <button
            onClick={unstable_retry}
            className="h-14 px-8 rounded-xl bg-gray-900 text-white text-base font-semibold hover:bg-gray-800 transition-colors"
          >
            Tornar a intentar
          </button>
        </div>
      </main>
    </div>
  )
}
