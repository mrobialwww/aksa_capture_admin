import Link from 'next/link'
import { X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Video } from '@/lib/api'

interface VideoListCardProps {
  video: Video
  displayLabel: string // e.g. "VID-001"
  type: string
  slug: string
}

export function VideoListCard({ video, displayLabel, type, slug }: VideoListCardProps) {
  const hasNotes = Boolean(video?.label?.reasoning && video.label.reasoning.trim() !== '')

  return (
    <Link
      href={`/materi/${type}/${slug}/${video.sample_id}`}
      className="block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <Card
        className={cn(
          'relative flex h-[104px] flex-col items-center justify-center rounded-xl transition-all hover:shadow-md',
          hasNotes
            ? 'bg-[#DDE8FA] border-transparent shadow-none hover:bg-[#D4E2F7]'
            : 'bg-white border-slate-200 shadow-sm'
        )}
      >
        <span className="font-mono text-[13px] font-semibold tracking-wider text-[#001D4A]">
          {displayLabel}
        </span>

        {/* Blue X in bottom-right when notes is empty */}
        {!hasNotes && (
          <div className="absolute bottom-2.5 right-2.5 flex size-5 items-center justify-center rounded-full bg-[#0A56D9]/10">
            <X className="size-3 text-[#0A56D9]" strokeWidth={3} />
          </div>
        )}
      </Card>
    </Link>
  )
}
