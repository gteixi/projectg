'use client'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="ca">
      <body className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error inesperat</h1>
          <p className="text-base text-gray-500 mb-6">{error.message}</p>
          <button
            onClick={unstable_retry}
            className="h-14 px-8 rounded-xl bg-gray-900 text-white text-base font-semibold hover:bg-gray-800 transition-colors"
          >
            Tornar a intentar
          </button>
        </div>
      </body>
    </html>
  )
}
