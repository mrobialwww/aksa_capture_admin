import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MateriTabs } from './_components/materi-tabs'

export const metadata: Metadata = {
  title: 'Materi BISINDO | Aksa Capture Admin',
  description: 'Kelola data huruf dan kata BISINDO untuk training model capture.',
}

// Server Component — tidak ada 'use client'
export default function MateriPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Admin Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-13 max-w-7xl items-center gap-2.5 px-6">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Aksa Capture
          </span>
          <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-semibold tracking-wide uppercase">
            Admin
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <MateriTabs />
      </main>
    </div>
  )
}
