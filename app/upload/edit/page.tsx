import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VideoEditor } from '../_components/video-editor'

export const metadata = {
  title: 'Edit Video | Aksa Capture',
  description: 'Trim dan edit video sebelum diunggah',
}

interface PageProps {
  searchParams: Promise<{
    type?: string
    label?: string
    is_correct?: string
    capture_location?: string
  }>
}

export default async function EditPage({ searchParams }: PageProps) {
  const sp = await searchParams

  const backUrl = `/upload/source?${new URLSearchParams({
    type: sp.type ?? 'huruf',
    label: sp.label ?? '',
    is_correct: sp.is_correct ?? 'true',
    capture_location: sp.capture_location ?? 'indoor',
  }).toString()}`

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Pilih Ulang Video
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#001D4A]">
            Edit Video
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trim video untuk mengambil bagian yang paling relevan, atau lewati langsung ke preview.
          </p>
        </div>

        <VideoEditor />
      </div>
    </div>
  )
}
