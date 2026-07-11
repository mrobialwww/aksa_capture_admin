'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Maximize, AlertCircle, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  videoUrl?: string
  className?: string
  style?: React.CSSProperties
}

export function VideoPlayerPlaceholder({ videoUrl, className, style }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState('0:00')
  const [duration, setDuration] = useState('0:00')
  const [videoError, setVideoError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)

  // ─── Video controls ────────────────────────────────────────────────────────

  const toggle = async () => {
    const v = videoRef.current
    if (!v) return
    try {
      if (isPlaying) {
        v.pause()
        setIsPlaying(false)
      } else {
        await v.play()
        setIsPlaying(true)
      }
    } catch (err) {
      setIsPlaying(false)
      const msg = err instanceof Error ? err.message : String(err)
      setVideoError(`Gagal memutar video: ${msg}`)
    }
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v || isNaN(v.duration) || v.duration === 0) return
    setProgress((v.currentTime / v.duration) * 100)
    setCurrentTime(fmt(v.currentTime))
  }

  const handleLoadedMetadata = () => {
    const v = videoRef.current
    if (!v) return
    if (!isNaN(v.duration) && isFinite(v.duration)) {
      setDuration(fmt(v.duration))
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
  }

  const handleError = () => {
    setIsPlaying(false)
    setVideoError('Video tidak dapat dimuat. Periksa URL atau koneksi.')
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || isNaN(v.duration)) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    v.currentTime = ratio * v.duration
  }

  const handleFullscreen = () => {
    const v = videoRef.current
    if (!v) return
    if (v.requestFullscreen) v.requestFullscreen()
    else if ((v as any).webkitRequestFullscreen) (v as any).webkitRequestFullscreen()
  }

  // ─── Formatting ─────────────────────────────────────────────────────────────

  const fmt = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className={cn("flex flex-col items-center gap-2 w-full", className)} style={style}>
      {/* Container */}
      <div
        className="group relative w-full overflow-hidden rounded-2xl bg-slate-900 shadow-sm ring-1 ring-border/10"
        style={{
          aspectRatio: style?.aspectRatio || '9 / 16',
          maxHeight: style?.maxHeight || '65vh',
        }}
      >
        {/* Video element — browser handles rotation via metadata automatically */}
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            preload="metadata"
            playsInline
            muted={isMuted}
            className="absolute inset-0 h-full w-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onError={handleError}
          />
        )}

        {/* Placeholder kosong jika tidak ada URL */}
        {!videoUrl && (
          <div className="absolute inset-0 bg-linear-to-br from-slate-800 to-slate-950" />
        )}

        {/* Error overlay */}
        {videoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 px-6 text-center">
            <AlertCircle className="size-10 text-red-400" />
            <p className="text-sm font-medium text-red-300">{videoError}</p>
            <p className="break-all text-xs text-slate-400">{videoUrl}</p>
          </div>
        )}

        {/* Center Play overlay */}
        {!videoError && (
          <div
            className="absolute inset-0 flex cursor-pointer items-center justify-center"
            onClick={toggle}
          >
            {!isPlaying && (
              <div className="flex size-16 items-center justify-center rounded-full bg-[#0A56D9] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#0848B8]">
                <Play className="ml-1 size-8" fill="currentColor" />
              </div>
            )}
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-linear-to-t from-black/80 via-black/40 to-transparent p-3 pt-12">
          <button
            className="text-white/90 hover:text-white transition-colors"
            onClick={toggle}
          >
            {isPlaying
              ? <Pause className="size-5" fill="currentColor" />
              : <Play className="ml-0.5 size-5" fill="currentColor" />}
          </button>

          {/* Progress Bar */}
          <div
            className="flex h-5 flex-1 cursor-pointer items-center"
            onClick={handleSeek}
          >
            <div className="relative h-1.5 w-full rounded-full bg-white/20">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#0A56D9] transition-all"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute -right-2 top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-white shadow" />
              </div>
            </div>
          </div>

          <span className="text-[11px] font-medium text-white/90 tabular-nums">
            {currentTime} / {duration}
          </span>

          <button
            className="text-white/90 hover:text-white transition-colors"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>

          <button
            className="text-white/90 hover:text-white transition-colors"
            onClick={handleFullscreen}
          >
            <Maximize className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
