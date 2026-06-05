'use client'

import { useState } from 'react'
import { Save, BookText, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL

interface CatatanFormProps {
  videoId: string
  initialNotes?: string
}

export function CatatanForm({ videoId, initialNotes = '' }: CatatanFormProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch(`${API_BASE}/api/v1/videos/${videoId}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify({ notes }),
      })

      if (!res.ok) {
        throw new Error(`Gagal menyimpan: ${res.status}`)
      }

      setSaved(true)
      toast.success('Catatan berhasil disimpan!')
      
      // Auto keluar dari halaman detail setelah sukses
      setTimeout(() => {
        router.back()
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="rounded-[20px] shadow-sm ring-1 ring-border/50 border-none">
      <CardHeader className="pb-4 flex flex-row items-center gap-2.5 pt-6 px-6">
        <BookText className="size-6 text-[#0A56D9]" />
        <CardTitle className="text-xl font-bold text-[#001D4A]">Catatan Pengembang</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tulis catatan pengembangan untuk gerakan ini..."
          className="min-h-[140px] resize-y bg-[#F8FAFC] border-border/80 focus-visible:ring-[#0A56D9]/20 focus-visible:border-[#0A56D9] text-sm leading-relaxed p-4"
        />
        {error && (
          <p className="mt-2 text-xs text-red-600">{error}</p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-end gap-3 pt-0 px-6 pb-6">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="size-4" />
            Tersimpan
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#0A56D9] hover:bg-[#0848B8] text-white gap-2.5 rounded-xl h-11 px-6 text-sm font-semibold transition-all shadow-sm"
        >
          <Save className="size-4" strokeWidth={2.5} />
          {isSaving ? 'Menyimpan...' : 'Simpan Catatan'}
        </Button>
      </CardFooter>
    </Card>
  )
}
