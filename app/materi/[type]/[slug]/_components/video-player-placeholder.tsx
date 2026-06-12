'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  // Rotasi manual: mengatasi EXIF rotation yang diterapkan browser secara terlambat
  // (moov atom di akhir file → browser terapkan rotasi setelah beberapa detik buffering)
  const [rotationDeg, setRotationDeg] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const prevDimsRef = useRef<{ w: number; h: number } | null>(null)

  // ─── Canvas render loop ────────────────────────────────────────────────────
  // Menggambar frame video ke canvas setiap requestAnimationFrame.
  // Dengan ini, rotasi yang diterapkan browser ke elemen <video> TIDAK mempengaruhi
  // apa yang ditampilkan di canvas — kita mendapat frame mentah tanpa rotasi browser.
  const drawFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const vw = video.videoWidth
    const vh = video.videoHeight

    if (vw > 0 && vh > 0) {
      // Deteksi perubahan dimensi: jika browser tiba-tiba menukar w/h,
      // itu tandanya browser baru saja menerapkan rotasi 90°/270° dari metadata.
      const prev = prevDimsRef.current
      if (prev && (prev.w !== vw || prev.h !== vh)) {
        // Dimensi berubah → browser menerapkan rotasi 90°/270°
        // Koreksi balik: tambah 270° (= -90°) atau 90°
        const wasSwapped = prev.w === vh && prev.h === vw
        if (wasSwapped) {
          setRotationDeg((d) => (d + 270) % 360)
        }
      }
      prevDimsRef.current = { w: vw, h: vh }

      // Sesuaikan ukuran canvas dengan dimensi video asli
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw
        canvas.height = vh
      }

      // Terapkan rotasi kita sendiri ke canvas
      ctx.save()
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (rotationDeg !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotationDeg * Math.PI) / 180)
        ctx.drawImage(video, -vw / 2, -vh / 2, vw, vh)
      } else {
        ctx.drawImage(video, 0, 0, vw, vh)
      }

      ctx.restore()
    }

    rafRef.current = requestAnimationFrame(drawFrame)
  }, [rotationDeg])

  // Mulai/hentikan render loop sesuai status playing
  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(drawFrame)
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      // Gambar 1 frame saat pause agar canvas tidak blank
      drawFrame()
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, drawFrame])

  // ─── Video event handlers ──────────────────────────────────────────────────
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
    if (!v || isNaN(v.duration)) return
    setProgress((v.currentTime / v.duration) * 100)
    setCurrentTime(fmt(v.currentTime))
  }

  const handleLoadedMetadata = () => {
    const v = videoRef.current
    if (!v) return
    if (!isNaN(v.duration)) setDuration(fmt(v.duration))
    // Simpan dimensi awal sebagai referensi deteksi rotasi browser yang terlambat
    prevDimsRef.current = { w: v.videoWidth, h: v.videoHeight }
    // Gambar frame pertama ke canvas
    drawFrame()
  }

  const handleEnded = () => {
    setIsPlaying(false)
    drawFrame()
  }

  const handleError = () => {
    setIsPlaying(false)
    setVideoError('Video tidak dapat dimuat. Periksa URL atau koneksi.')
  }

  // ─── Formatting ────────────────────────────────────────────────────────

  const fmt = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  // Canvas fullscreen
  const handleFullscreen = () => {
    const canvas = canvasRef.current
    if (canvas?.requestFullscreen) canvas.requestFullscreen()
  }

  return (
    <div className={cn("flex flex-col items-center gap-2 w-full", className)} style={style}>
      {/* Container dinamis (default portrait 9:16 jika tidak di-override) */}
      <div
        className="group relative w-full h-full overflow-hidden rounded-2xl bg-slate-900 shadow-sm ring-1 ring-border/10"
        style={{ 
          aspectRatio: style?.aspectRatio || '9 / 16',
          maxHeight: style?.maxHeight || '65vh',
        }}
      >
        {/* Video tersembunyi — hanya sebagai sumber frame, tidak ditampilkan */}
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            preload="metadata"
            playsInline
            muted={isMuted}
            className="absolute inset-0 h-full w-full"
            style={{ visibility: 'hidden', pointerEvents: 'none' }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onError={handleError}
          />
        )}

        {/* Canvas — menampilkan frame video tanpa rotasi dari browser */}
        {videoUrl && !videoError && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            style={{ objectFit: 'contain' }}
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
          <div className="flex h-5 flex-1 cursor-pointer items-center">
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
