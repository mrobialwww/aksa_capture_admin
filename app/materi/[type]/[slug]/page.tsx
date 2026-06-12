import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { VideoListCard } from './_components/video-list-card'
import { getVideos } from '@/lib/api'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{
    type: string
    slug: string
  }>
  searchParams: Promise<{
    page?: string
    is_correct?: string
  }>
}

export default async function VideoListPage({ params, searchParams }: PageProps) {
  const { type, slug } = await params
  const sp = await searchParams

  const decodedSlug = decodeURIComponent(slug)
  const isHuruf = type.toLowerCase() === 'huruf'
  const typeLabel = isHuruf ? 'Huruf' : 'Kata'

  const ITEMS_PER_PAGE = 20
  const currentPage = Math.max(1, Number(sp.page) || 1)

  // Parse is_correct — default ke undefined (tidak difilter) jika tidak ada param
  const isCorrectParam = sp.is_correct === 'true'
    ? true
    : sp.is_correct === 'false'
    ? false
    : undefined

  // Fetch dari API nyata
  let videos: Awaited<ReturnType<typeof getVideos>>['data'] = []
  let totalPages = 1
  let fetchError: string | null = null

  const apiType = isHuruf ? 'letter' : 'word'

  try {
    const res = await getVideos({
      type: apiType,
      label: decodedSlug,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      is_correct: isCorrectParam,
    })
    // API bisa return data: null ketika kosong, bukan []
    videos = Array.isArray(res.data) ? res.data : []
    totalPages = res.meta?.total_pages ?? 1
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Gagal memuat data video'
  }

  // Helper untuk membangun URL pagination dengan tetap mempertahankan is_correct
  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams()
    params.set('page', String(p))
    if (sp.is_correct !== undefined) params.set('is_correct', sp.is_correct)
    return `?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1000px] pt-8 px-6">
        <Link
          href="/materi"
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#0A56D9] hover:text-[#0848B8] transition-colors"
        >
          <ArrowLeft className="size-4" strokeWidth={2.5} />
          Kembali
        </Link>

        <h1 className="mt-8 text-[32px] font-bold text-[#001D4A] tracking-tight">
          Video List – {typeLabel} {decodedSlug}
        </h1>

        {/* Error state */}
        {fetchError && (
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertCircle className="size-5 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Empty state */}
        {!fetchError && videos.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-2 text-center text-muted-foreground">
            <p className="text-lg font-semibold">Tidak ada video ditemukan</p>
            <p className="text-sm">Coba ubah filter Gerakan Benar / Gerakan Salah di halaman sebelumnya.</p>
          </div>
        )}

        {/* Video Grid */}
        {!fetchError && videos.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {videos.map((video) => {
              // Tampilkan 8 karakter pertama UUID sebagai identifier pendek
              // contoh: "550e8400-e29b-41d4-a716-446655440000" → "550e8400"
              const displayLabel = video.sample_id.slice(0, 8)
              return (
                <VideoListCard
                  key={video.sample_id}
                  video={video}
                  displayLabel={displayLabel}
                  type={type}
                  slug={slug}
                />
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!fetchError && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2 pb-12">
            <Link
              href={buildPageUrl(currentPage - 1)}
              className={cn(
                'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-200/60',
                currentPage <= 1 && 'pointer-events-none opacity-40'
              )}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Link>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1
                return (
                  <Link
                    key={p}
                    href={buildPageUrl(p)}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-md text-sm font-medium transition-colors',
                      p === currentPage
                        ? 'bg-[#0A56D9] text-white hover:bg-[#0848B8]'
                        : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                    )}
                  >
                    {p}
                  </Link>
                )
              })}
            </div>

            <Link
              href={buildPageUrl(currentPage + 1)}
              className={cn(
                'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-200/60',
                currentPage >= totalPages && 'pointer-events-none opacity-40'
              )}
            >
              Next
              <ChevronRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
