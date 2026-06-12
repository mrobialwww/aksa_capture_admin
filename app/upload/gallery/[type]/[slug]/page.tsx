import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { UserVideoList } from './_components/user-video-list'

export const metadata: Metadata = {
  title: 'Daftar Video Galeri | Aksa Capture',
  description: 'Daftar video yang Anda unggah untuk kategori ini.',
}

interface PageProps {
  params: Promise<{
    type: string
    slug: string
  }>
  searchParams: Promise<{
    is_correct?: string
  }>
}

export default async function GalleryVideoListPage({ params, searchParams }: PageProps) {
  const p = await params
  const sp = await searchParams
  
  const isCorrect = sp.is_correct === 'true'

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-12">
        <Link
          href="/upload/gallery"
          className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Galeri
        </Link>

        <UserVideoList 
          type={p.type} 
          slug={p.slug} 
          isCorrect={isCorrect} 
        />
      </div>
    </div>
  )
}
