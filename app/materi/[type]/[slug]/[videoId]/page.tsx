import Link from 'next/link'
import { ArrowLeft, Bookmark, Calendar, Shapes, AlertCircle, CheckCircle, XCircle, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getVideoById } from '@/lib/api'
import { VideoPlayerPlaceholder } from '../_components/video-player-placeholder'
import { CatatanForm } from '../_components/catatan-form'

interface PageProps {
  params: Promise<{
    type: string
    slug: string
    videoId: string
  }>
}

export default async function DetailVideoPage({ params }: PageProps) {
  const { type, slug, videoId } = await params
  const decodedSlug = decodeURIComponent(slug)
  const isHuruf = type.toLowerCase() === 'huruf'
  const typeLabel = isHuruf ? 'Huruf' : 'Kata'

  let video: Awaited<ReturnType<typeof getVideoById>>['data'] | null = null
  let fetchError: string | null = null

  try {
    const res = await getVideoById(videoId)
    video = res.data
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Gagal memuat data video'
  }

  // Format tanggal dari ISO ke bahasa Indonesia
  const formattedDate = video?.created_at
    ? new Date(video.created_at).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <div className="mx-auto max-w-[800px] pt-8 px-6">
        <Link
          href={`/materi/${type}/${slug}`}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" strokeWidth={2.5} />
          Kembali ke Daftar Video {typeLabel} {decodedSlug}
        </Link>

        {/* Error state */}
        {fetchError && (
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertCircle className="size-5 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {video && (
          <main className="mt-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-3">
                <h1 className="text-[40px] font-black tracking-tight text-[#001D4A] leading-none">
                  {decodedSlug}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="h-8 gap-2 rounded-full px-4 text-xs bg-[#E6F0FF] text-[#0A56D9] hover:bg-[#D4E5FF] border-transparent font-bold shadow-sm"
                  >
                    <Shapes className="size-3.5" strokeWidth={2.5} />
                    {typeLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      video.is_correct
                        ? 'h-8 gap-1.5 rounded-full px-4 text-xs border-emerald-200 bg-emerald-50 text-emerald-700 font-bold shadow-none'
                        : 'h-8 gap-1.5 rounded-full px-4 text-xs border-red-200 bg-red-50 text-red-700 font-bold shadow-none'
                    }
                  >
                    {video.is_correct
                      ? <CheckCircle className="size-3.5" strokeWidth={2.5} />
                      : <XCircle className="size-3.5" strokeWidth={2.5} />}
                    {video.is_correct ? 'Gerakan Benar' : 'Gerakan Salah'}
                  </Badge>
                  {/* Badge gender */}
                  {video.gender && (
                    <Badge
                      variant="outline"
                      className={
                        video.gender.toLowerCase() === 'male'
                          ? 'h-8 gap-1.5 rounded-full px-4 text-xs border-blue-200 bg-blue-50 text-blue-700 font-bold shadow-none'
                          : 'h-8 gap-1.5 rounded-full px-4 text-xs border-pink-200 bg-pink-50 text-pink-700 font-bold shadow-none'
                      }
                    >
                      <User className="size-3.5" strokeWidth={2.5} />
                      {video.gender.toLowerCase() === 'male' ? 'Laki-laki' : 'Perempuan'}
                    </Badge>
                  )}
                </div>
              </div>
              <button className="mt-1 text-muted-foreground/60 hover:text-foreground transition-colors">
                <Bookmark className="size-6" strokeWidth={2.5} />
              </button>
            </div>

            {/* Info perekam */}
            {video.name && (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E6F0FF]">
                  <User className="size-5 text-[#0A56D9]" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Nama Perekam</span>
                  <span className="text-[15px] font-semibold text-[#001D4A]">{video.name}</span>
                </div>
              </div>
            )}

            {/* Video Player — gunakan video_url asli dari API */}
            <VideoPlayerPlaceholder videoUrl={video.video_url} />

            {/* Metadata */}
            {formattedDate && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-[#E6F0FF]/60 px-5 py-4 text-[13px] text-[#001D4A]/80 font-medium">
                <Calendar className="size-[18px] text-[#0A56D9]/70 shrink-0" />
                <span>Dibuat: {formattedDate}</span>
              </div>
            )}

            {/* Notes Form — isi dari API notes */}
            <div className="mt-2">
              <CatatanForm videoId={videoId} initialNotes={video.notes ?? ''} />
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
