'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Play, Pause, Volume2, VolumeX, Scissors, ChevronRight, Loader2, RotateCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function VideoEditor() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(0)

  const [videoSrc, setVideoSrc] = useState('')
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [rotation, setRotation] = useState<number>(0)
  const [isExporting, setIsExporting] = useState(false)
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'playhead' | null>(null)

  // Load video from sessionStorage
  useEffect(() => {
    const url = sessionStorage.getItem('pendingVideoUrl')
    if (!url) {
      toast.error('Video tidak ditemukan. Silakan pilih kembali.')
      router.push(`/upload/source?${searchParams.toString()}`)
      return
    }
    setVideoSrc(url)
  }, [router, searchParams])

  // Sync video mute state
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted
  }, [isMuted])

  // Playhead animation loop
  const startLoop = useCallback(() => {
    const tick = () => {
      const video = videoRef.current
      if (!video) return
      setCurrentTime(video.currentTime)
      // Auto-stop at endTime
      if (video.currentTime >= endTime) {
        video.pause()
        video.currentTime = startTime
        setIsPlaying(false)
        return
      }
      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }, [endTime, startTime])

  const stopLoop = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
  }, [])

  const handlePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.currentTime < startTime || video.currentTime >= endTime) {
      video.currentTime = startTime
    }
    video.play()
    setIsPlaying(true)
    startLoop()
  }

  const handlePause = () => {
    videoRef.current?.pause()
    setIsPlaying(false)
    stopLoop()
  }

  // Convert relative timeline X → time
  const xToTime = (clientX: number): number => {
    const tl = timelineRef.current
    if (!tl || !duration) return 0
    const { left, width } = tl.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - left) / width))
    return ratio * duration
  }

  // Mouse / touch drag handlers
  const startDrag = (handle: 'start' | 'end') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    handlePause()
    setIsDragging(handle)
  }

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const t = xToTime(clientX)
      if (isDragging === 'start') {
        setStartTime(Math.min(t, endTime - 0.1))
        if (videoRef.current) videoRef.current.currentTime = Math.min(t, endTime - 0.1)
      } else {
        setEndTime(Math.max(t, startTime + 0.1))
        if (videoRef.current) videoRef.current.currentTime = Math.max(t, startTime + 0.1)
      }
    }
    const onUp = () => setIsDragging(null)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [isDragging, startTime, endTime, duration]) // eslint-disable-line

  // Scrub on timeline click (not on handles)
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (isDragging) return
    const t = xToTime(e.clientX)
    const clamped = Math.max(startTime, Math.min(endTime, t))
    setCurrentTime(clamped)
    if (videoRef.current) videoRef.current.currentTime = clamped
  }

  // Export: re-record the trimmed segment via MediaRecorder
  const handleExport = async () => {
    const video = videoRef.current
    if (!video || !duration) return
    setIsExporting(true)

    let animId: number | undefined

    const effectiveStart = startTime
    const effectiveEnd = endTime > 0 ? endTime : duration

    try {
      let stream: MediaStream

      if (rotation !== 0) {
        // MUST use canvas to burn the rotation transform into the video
        const canvas = document.createElement('canvas')
        const isPortrait = rotation === 90 || rotation === 270
        canvas.width = isPortrait ? video.videoHeight : video.videoWidth
        canvas.height = isPortrait ? video.videoWidth : video.videoHeight
        const ctx = canvas.getContext('2d')

        if (!ctx) throw new Error('Gagal memuat canvas untuk rotate video')

        stream = (canvas as any).captureStream?.(30) ?? (canvas as any).mozCaptureStream?.(30)
        if (!stream) throw new Error('Browser tidak mendukung canvas captureStream')

        // Add original audio if not muted
        if (!isMuted) {
          const audioStream: MediaStream = (video as any).captureStream?.() ?? (video as any).mozCaptureStream?.()
          if (audioStream) {
            const audioTracks = audioStream.getAudioTracks()
            if (audioTracks.length > 0) stream.addTrack(audioTracks[0])
          }
        }

        const drawCanvas = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.save()
          if (rotation === 90) {
            ctx.translate(canvas.width, 0)
            ctx.rotate(90 * Math.PI / 180)
          } else if (rotation === 180) {
            ctx.translate(canvas.width, canvas.height)
            ctx.rotate(180 * Math.PI / 180)
          } else if (rotation === 270) {
            ctx.translate(0, canvas.height)
            ctx.rotate(270 * Math.PI / 180)
          }
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
          ctx.restore()
          animId = requestAnimationFrame(drawCanvas)
        }
        animId = requestAnimationFrame(drawCanvas)
      } else {
        stream = (video as any).captureStream?.() ?? (video as any).mozCaptureStream?.()
        if (!stream) throw new Error('Browser ini tidak mendukung captureStream. Gunakan Chrome atau Edge.')

        if (isMuted) {
          stream.getAudioTracks().forEach(t => stream.removeTrack(t))
        }
      }

      const chunks: Blob[] = []
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

      // Wait for seek to complete reliably
      await new Promise<void>((resolve) => {
        const onSeeked = () => { video.removeEventListener('seeked', onSeeked); resolve() }
        video.addEventListener('seeked', onSeeked)
        video.currentTime = effectiveStart
        // Fallback: if seeked doesn't fire in 1s, continue anyway
        setTimeout(resolve, 1000)
      })

      recorder.start(100)
      video.muted = isMuted
      video.play()

      // Wait for video to reach endTime using timeupdate event
      await new Promise<void>((resolve) => {
        const onTimeUpdate = () => {
          if (video.currentTime >= effectiveEnd) {
            video.removeEventListener('timeupdate', onTimeUpdate)
            video.pause()
            if (animId) cancelAnimationFrame(animId)
            resolve()
          }
        }
        video.addEventListener('timeupdate', onTimeUpdate)

        // Safety timeout: max recording = trim duration + 5s buffer
        const maxMs = ((effectiveEnd - effectiveStart) + 5) * 1000
        setTimeout(() => {
          video.removeEventListener('timeupdate', onTimeUpdate)
          video.pause()
          if (animId) cancelAnimationFrame(animId)
          resolve()
        }, maxMs)
      })

      recorder.stop()

      await new Promise<void>((res) => {
        recorder.onstop = () => res()
        // Fallback if onstop doesn't fire
        setTimeout(res, 2000)
      })

      const blob = new Blob(chunks, { type: mimeType })
      const trimmedUrl = URL.createObjectURL(blob)
      const originalName = sessionStorage.getItem('pendingVideoName') || `video_${Date.now()}.webm`
      const trimmedName = `trimmed_${originalName.replace(/\.[^/.]+$/, '')}.webm`

      // Revoke old URL and store new trimmed one
      const oldUrl = sessionStorage.getItem('pendingVideoUrl')
      if (oldUrl?.startsWith('blob:')) URL.revokeObjectURL(oldUrl)

      sessionStorage.setItem('pendingVideoUrl', trimmedUrl)
      sessionStorage.setItem('pendingVideoName', trimmedName)
      sessionStorage.setItem('pendingVideoType', mimeType)

      toast.success('Video berhasil diproses!')
      // Pass the real trim duration via URL — MediaRecorder webm files don't store
      // duration in their header, so we compute it here and forward it as a query param.
      const previewParams = new URLSearchParams(searchParams.toString())
      previewParams.set('duration_sec', String((effectiveEnd - effectiveStart).toFixed(3)))
      router.push(`/upload/preview?${previewParams.toString()}`)
    } catch (err) {
      if (animId) cancelAnimationFrame(animId)
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Gagal memproses video')
      setIsExporting(false)
    }
  }

  // Skip to preview without editing
  const handleSkip = () => {
    router.push(`/upload/preview?${searchParams.toString()}`)
  }

  const pct = (t: number) => duration > 0 ? `${(t / duration) * 100}%` : '0%'
  const trimDuration = (endTime - startTime).toFixed(1)

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    const ms = Math.floor((t % 1) * 10)
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`
  }

  const getVideoScale = () => {
    if (rotation === 90 || rotation === 270) {
      if (!videoRef.current) return 0.5625 // fallback to 16:9 inverse
      const v = videoRef.current
      if (v.videoHeight > v.videoWidth) return 1 // if portrait, no need to scale down much
      return v.videoHeight / v.videoWidth
    }
    return 1
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Video Preview */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-lg flex items-center justify-center">
        {videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            className="object-contain transition-transform duration-300"
            style={{ 
              transform: `rotate(${rotation}deg) scale(${getVideoScale()})`,
              maxHeight: '100%',
              maxWidth: '100%'
            }}
            muted={isMuted}
            onLoadedMetadata={() => {
              const d = videoRef.current!.duration
              setDuration(d)
              setEndTime(d)
            }}
            onEnded={() => { setIsPlaying(false); stopLoop() }}
            playsInline
          />
        )}

        {/* Overlay Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3 bg-linear-to-t from-black/70 to-transparent">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="size-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
          >
            {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
          </button>
          <button
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="size-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            title="Putar Video 90 Derajat"
          >
            <RotateCw className="size-5" />
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="size-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            title={isMuted ? "Suara dimatikan" : "Matikan Suara"}
          >
            {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <span className="ml-auto text-white/80 text-xs font-mono tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Trim Editor Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/50 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scissors className="size-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#001D4A]">Trim Video</h3>
              <p className="text-xs text-muted-foreground">Seret handle untuk mengatur titik awal & akhir</p>
            </div>
          </div>
          <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {trimDuration}s
          </span>
        </div>

        {/* Timeline */}
        <div className="flex flex-col gap-2">
          {/* Time labels */}
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground px-1">
            <span>0:00</span>
            <span>{formatTime(duration / 2)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Track */}
          <div
            ref={timelineRef}
            className="relative h-12 rounded-xl bg-slate-100 cursor-pointer select-none overflow-visible"
            onClick={handleTimelineClick}
          >
            {/* Full bar */}
            <div className="absolute inset-0 rounded-xl bg-slate-200/80" />

            {/* Trimmed region (highlighted) */}
            <div
              className="absolute top-0 bottom-0 bg-primary/20 border-y-2 border-primary"
              style={{ left: pct(startTime), right: `calc(100% - ${pct(endTime)})` }}
            />

            {/* Start handle */}
            <div
              className={cn(
                'absolute top-0 bottom-0 w-4 -ml-2 flex items-center justify-center cursor-ew-resize z-10',
                isDragging === 'start' && 'z-20'
              )}
              style={{ left: pct(startTime) }}
              onMouseDown={startDrag('start')}
              onTouchStart={startDrag('start')}
            >
              <div className="w-4 h-full rounded-l-lg bg-primary flex items-center justify-center shadow-md">
                <div className="flex flex-col gap-0.5">
                  <div className="w-0.5 h-3 bg-white/70 rounded-full" />
                </div>
              </div>
            </div>

            {/* End handle */}
            <div
              className={cn(
                'absolute top-0 bottom-0 w-4 -mr-2 flex items-center justify-center cursor-ew-resize z-10',
                isDragging === 'end' && 'z-20'
              )}
              style={{ left: pct(endTime) }}
              onMouseDown={startDrag('end')}
              onTouchStart={startDrag('end')}
            >
              <div className="w-4 h-full rounded-r-lg bg-primary flex items-center justify-center shadow-md">
                <div className="flex flex-col gap-0.5">
                  <div className="w-0.5 h-3 bg-white/70 rounded-full" />
                </div>
              </div>
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
              style={{ left: pct(currentTime) }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 size-2.5 rounded-full bg-red-500" />
            </div>
          </div>

          {/* Start / End time labels */}
          <div className="flex justify-between text-xs font-mono text-primary px-1 font-bold">
            <span>▶ {formatTime(startTime)}</span>
            <span>{formatTime(endTime)} ■</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1 rounded-xl h-11 font-semibold text-muted-foreground border-border/80"
            disabled={isExporting}
          >
            Lewati Edit
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-2 rounded-xl h-11 bg-[#0A56D9] hover:bg-[#0848B8] text-white font-bold shadow-md shadow-blue-500/20 gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Scissors className="size-4" />
                Terapkan & Lanjut
                <ChevronRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
