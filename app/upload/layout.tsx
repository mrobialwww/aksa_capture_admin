import { Video } from 'lucide-react'
import Link from 'next/link'

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-6">
          <Link href="/" className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Video className="size-4" />
            </div>
            <span className="text-base font-bold text-foreground"> 
              Aksa Capture
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
