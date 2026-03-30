import { Sidebar } from '@/components/Sidebar'

export default function NotFound() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-[#f8f7f4] pb-20 md:ml-[120px] md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-7 flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <p className="text-lg text-gray-500 mb-8">Aquesta pàgina no existeix</p>
          <a
            href="/"
            className="h-14 px-8 rounded-xl bg-gray-900 text-white text-base font-semibold inline-flex items-center hover:bg-gray-800 transition-colors"
          >
            Tornar a l&apos;inici
          </a>
        </div>
      </main>
    </div>
  )
}
