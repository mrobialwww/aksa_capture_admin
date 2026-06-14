'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Circle, Square } from 'lucide-react'
import { toast } from 'sonner'

export function CameraRecorder({ 
  onComplete, 
  onCancel 
}: { 
  onComplete: (file: File) => void,
  onCancel: () => void 
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  const [isRecording, setIsRecording] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [timer, setTimer] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    // Start camera when component mounts
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      setTimer(0)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  // Auto-stop at 5 minutes (300 seconds)
  useEffect(() => {
    if (timer >= 300 && isRecording) {
      handleStopRecording()
      toast.info('Batas waktu perekaman maksimal 5 menit telah tercapai.')
    }
  }, [timer, isRecording])

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }, // use front camera by default for signs, target 720p 30fps
        audio: false // Force no audio for sign language capture
      })
      setStream(ms)
      if (videoRef.current) {
        videoRef.current.srcObject = ms
      }
    } catch (err) {
      setError('Gagal mengakses kamera. Pastikan Anda telah memberikan izin.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
  }

  const handleStartRecording = () => {
    if (!stream) return
    
    chunksRef.current = []
    
    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 850000 // Compress to ~850 kbps
      })
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const file = new File([blob], `recorded_video_${Date.now()}.webm`, { type: 'video/webm' })
        onComplete(file)
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // chunk every second
      setIsRecording(true)
    } catch (err) {
      toast.error('Format perekaman tidak didukung browser ini. Gunakan fitur "Pilih dari Galeri".')
      console.error(err)
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      // mediaRecorder.onstop will trigger onComplete
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-2xl border-2 border-red-200">
        <p className="text-red-700 font-medium mb-4">{error}</p>
        <button onClick={onCancel} className="text-sm font-bold text-red-700 underline">Kembali</button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-linear-to-b from-black/50 to-transparent">
        <button 
          onClick={() => { stopCamera(); onCancel(); }}
          className="size-10 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md"
        >
          <X className="size-6" />
        </button>
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/90 text-white font-mono text-sm font-bold animate-pulse">
            <div className="size-2 rounded-full bg-white" />
            {formatTime(timer)}
          </div>
        )}
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center pb-safe z-10 bg-linear-to-t from-black/80 to-transparent">
        {!isRecording ? (
          <button 
            onClick={handleStartRecording}
            className="size-20 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-transform active:scale-95"
          >
            <div className="w-full h-full rounded-full bg-red-500" />
          </button>
        ) : (
          <button 
            onClick={handleStopRecording}
            className="size-20 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-transform active:scale-95"
          >
            <div className="w-full h-full rounded-md bg-red-500 flex items-center justify-center">
              <Square className="size-6 text-white" fill="currentColor" />
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
