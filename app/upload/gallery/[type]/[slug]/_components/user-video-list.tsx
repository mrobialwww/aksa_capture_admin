'use client'

import { useState, useEffect } from 'react'
import { Video, Play, Trash2, Calendar, MapPin, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VideoPlayerPlaceholder } from '@/app/materi/[type]/[slug]/_components/video-player-placeholder'
import { toast } from 'sonner'
import { getVideos, deleteVideo } from '@/lib/api'
import { useUserStore } from '@/lib/store/useUserStore'

interface VideoItem {
  id: string
  date: string
  duration: string
  location: string
  url: string
}

interface UserVideoListProps {
  type: string
  slug: string
  isCorrect: boolean
}

export function UserVideoList({ type, slug, isCorrect }: UserVideoListProps) {
  const { name: storeName } = useUserStore()
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function fetchVideos() {
      if (!storeName) return

      try {
        setIsLoading(true)
        const apiType = type.toLowerCase() === 'huruf' ? 'letter' : 'word'
        const res = await getVideos({
          type: apiType,
          label: decodeURIComponent(slug),
          is_correct: isCorrect,
          signer_name: storeName,
          limit: 100 // Fetch all user videos for this category
        })

        if (res.data) {
          const formatted = res.data.map((v) => {
            const d = new Date(v.created_at)
            const formatter = new Intl.DateTimeFormat('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })
            return {
              id: v.sample_id,
              date: formatter.format(d).replace(/\./g, ':'),
              duration: v.media.duration_sec.toFixed(1) + 's',
              location: v.media.capture_location || 'Indoor',
              url: v.media.video_url || '',
            }
          })
          setVideos(formatted)
        } else {
          setVideos([])
        }
      } catch (err) {
        console.error(err)
        toast.error('Gagal mengambil daftar video')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()
  }, [type, slug, isCorrect, storeName])

  const handleVideoClick = (video: VideoItem) => {
    setSelectedVideo(video)
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedVideo) return
    
    try {
      setIsDeleting(true)
      await deleteVideo(selectedVideo.id)
      setVideos((prev) => prev.filter((v) => v.id !== selectedVideo.id))
      setIsDialogOpen(false)
      setSelectedVideo(null)
      toast.success('Video berhasil dihapus')
    } catch (err) {
      console.error(err)
      toast.error('Gagal menghapus video. Silakan coba lagi.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#001D4A]">
          Video Anda untuk "{decodeURIComponent(slug)}"
        </h2>
        <Badge
          variant="outline"
          className={
            isCorrect
              ? 'h-8 gap-1.5 rounded-full px-4 text-xs border-emerald-200 bg-emerald-50 text-emerald-700 font-bold shadow-none'
              : 'h-8 gap-1.5 rounded-full px-4 text-xs border-red-200 bg-red-50 text-red-700 font-bold shadow-none'
          }
        >
          {isCorrect ? (
            <CheckCircle className="size-3.5" strokeWidth={2.5} />
          ) : (
            <XCircle className="size-3.5" strokeWidth={2.5} />
          )}
          {isCorrect ? 'Gerakan Benar' : 'Gerakan Salah'}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="size-10 text-[#0A56D9] animate-spin mb-4" />
          <p className="text-slate-500 text-sm font-medium">Memuat video Anda...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-2xl border-slate-200 bg-slate-50">
          <Video className="size-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Belum ada video</h3>
          <p className="text-slate-500 text-sm mt-1">Anda belum mengunggah video untuk label ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {videos.map((video) => (
            <Card 
              key={video.id}
              className="overflow-hidden cursor-pointer group hover:shadow-md transition-all border-slate-200"
              onClick={() => handleVideoClick(video)}
            >
              {/* Thumbnail Mock */}
              <div className="aspect-9/16 bg-slate-900 relative flex items-center justify-center overflow-hidden">
                <Play className="size-10 text-white/50 group-hover:text-white group-hover:scale-110 transition-all z-10" />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent z-0" />
                <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-white z-10 font-medium">
                  <span>{video.duration}</span>
                </div>
              </div>
              
              {/* Metadata */}
              <div className="p-3 bg-white space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="size-3.5" />
                  <span>{video.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="size-3.5" />
                  <span className="capitalize">{video.location}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Video Player & Delete Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl sm:max-w-4xl w-[95vw] border-0 p-0 overflow-hidden bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Preview Video</DialogTitle>
            <DialogDescription>
              Putar atau hapus video yang Anda pilih
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center w-full">
            {/* Player Container */}
            <div className="w-full flex justify-center items-center bg-black/50">
              {/* In a real app, pass the actual video URL. For UI slicing, the placeholder will handle empty nicely or show error. */}
              <VideoPlayerPlaceholder 
                videoUrl={selectedVideo?.url || ''} 
                style={{ aspectRatio: '16/9', maxHeight: '75vh' }}
              />
            </div>

            {/* Actions */}
            <div className="p-4 sm:p-6 bg-white w-full flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm font-medium text-slate-600">
                Diunggah: {selectedVideo?.date}
              </div>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto rounded-xl font-bold"
              >
                {isDeleting ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="size-4 mr-2" />
                )}
                Hapus Video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
