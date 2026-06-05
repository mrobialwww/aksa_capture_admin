import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aksa Capture Admin',
  description: 'Panel admin untuk pengelolaan data gerakan BISINDO',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}

