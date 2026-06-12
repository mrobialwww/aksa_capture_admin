import type { Metadata } from 'next'
import Link from 'next/link'
import { Library, ArrowLeft } from 'lucide-react'
import { GalleryTabs } from './_components/gallery-tabs'

export const metadata: Metadata = {
  title: 'Galeri Upload | Aksa Capture',
  description: 'Lihat daftar video yang pernah Anda unggah.',
}

export default function GalleryPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-12">
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Upload
        </Link>

        <div className="mb-6 flex flex-col justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#001D4A] flex items-center gap-2">
              <Library className="size-6 text-[#0A56D9]" />
              Galeri Upload
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Riwayat video kontribusi Anda. Pilih label untuk melihat daftar video.
            </p>
          </div>
        </div>

        <GalleryTabs />
      </div>
    </div>
  )
}
