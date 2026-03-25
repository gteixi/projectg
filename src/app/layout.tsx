import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "PrepList Pro",
  description: "Gestió de producció de cuina professional",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ca" className={`${dmSans.className} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
