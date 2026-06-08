'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getUploadUrl, uploadVideoToCloud, createVideoMetadata } from '@/lib/api'
import { VideoPlayerPlaceholder } from '@/app/materi/[type]/[slug]/_components/video-player-placeholder'

interface UploadProgressProps {
  type: string
  label: string
  isCorrect: boolean
}

type UploadStep = 'idle' | 'siap' | 'url' | 'upload' | 'simpan' | 'success' | 'error'

export function UploadProgress({ type, label, isCorrect }: UploadProgressProps) {
  const router = useRouter()
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [step, setStep] = useState<UploadStep>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Load video URL from sessionStorage
    const url = sessionStorage.getItem('pendingVideoUrl')
    if (url) {
      setVideoUrl(url)
    } else {
      toast.error('Video tidak ditemukan. Silakan pilih kembali.')
      router.push(`/upload/source?type=${type}&label=${label}&is_correct=${isCorrect}`)
    }
  }, [type, label, isCorrect, router])

  const handleUpload = async () => {
    if (!videoUrl) return
    
    try {
      setStep('siap')
      
      // Get file from object URL to upload
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      
      const fileName = sessionStorage.getItem('pendingVideoName') || `video_${Date.now()}.webm`
      const mimeType = sessionStorage.getItem('pendingVideoType') || blob.type || 'video/webm'
      const file = new File([blob], fileName, { type: mimeType })

      setStep('url')
      const uploadData = await getUploadUrl({
        type,
        label,
      })

      setStep('upload')
      await uploadVideoToCloud(uploadData.upload_url, file, mimeType)

      setStep('simpan')
      await createVideoMetadata({
        id: uploadData.id,
        video_path: uploadData.video_path,
        label,
        type,
        is_correct: isCorrect,
        notes: ''
      })

      setStep('success')
      toast.success('Video berhasil diunggah!')
      
      // Clear session storage
      sessionStorage.removeItem('pendingVideoUrl')
      sessionStorage.removeItem('pendingVideoName')
      sessionStorage.removeItem('pendingVideoType')
      URL.revokeObjectURL(videoUrl) // free memory
      
      // Go back to step 1
      setTimeout(() => {
        router.push('/upload')
      }, 1500)

    } catch (err) {
      console.error(err)
      setStep('error')
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengunggah video')
      toast.error('Proses upload gagal')
    }
  }

  const steps = [
    { id: 'siap', label: 'Persiapan' },
    { id: 'url', label: 'Minta URL' },
    { id: 'upload', label: 'Upload' },
    { id: 'simpan', label: 'Simpan' }
  ]

  const currentStepIndex = steps.findIndex(s => s.id === step)

  return (
    <div className="flex flex-col gap-6">
      {/* Video Preview */}
      <div className="rounded-2xl overflow-hidden bg-black shadow-sm">
        {videoUrl && <VideoPlayerPlaceholder videoUrl={videoUrl} />}
      </div>

      {/* Progress or Upload Button */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/50">
        {step === 'idle' || step === 'error' ? (
          <div className="flex flex-col gap-4">
            {step === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertCircle className="size-4 shrink-0" />
                {errorMsg}
              </div>
            )}
            <Button
              onClick={handleUpload}
              className="w-full rounded-xl h-14 bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              <UploadCloud className="mr-2 size-5" />
              Upload Video
            </Button>
          </div>
        ) : step === 'success' ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3 text-emerald-600">
            <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg">Upload Berhasil!</h3>
            <p className="text-sm text-muted-foreground">Mengarahkan kembali...</p>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            <h3 className="font-bold text-center text-[#001D4A]">Sedang Mengunggah...</h3>
            
            <div className="relative flex justify-between">
              <div className="absolute left-0 top-3 w-full h-1 bg-muted rounded-full -z-10" />
              <div 
                className="absolute left-0 top-3 h-1 bg-primary rounded-full -z-10 transition-all duration-500 ease-in-out" 
                style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
              />
              
              {steps.map((s, i) => {
                const isPast = currentStepIndex > i
                const isCurrent = step === s.id
                
                return (
                  <div key={s.id} className="flex flex-col items-center gap-2">
                    <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isPast ? 'bg-primary text-white' : 
                      isCurrent ? 'bg-primary text-white ring-4 ring-primary/20' : 
                      'bg-muted text-muted-foreground border-2 border-background'
                    }`}>
                      {isPast ? <CheckCircle2 className="size-4" /> : i + 1}
                    </div>
                    <span className={`text-[10px] font-bold ${isCurrent || isPast ? 'text-primary' : 'text-muted-foreground'}`}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
