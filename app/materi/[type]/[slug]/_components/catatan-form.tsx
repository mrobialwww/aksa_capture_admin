'use client'

import { useState } from 'react'
import { Save, BookText, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Video } from '@/lib/api'

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL

interface CatatanFormProps {
  video: Video
}

export function CatatanForm({ video }: CatatanFormProps) {
  const [notes, setNotes] = useState(video.label?.reasoning ?? '')
  const [handsVisible, setHandsVisible] = useState(video.quality?.hands_visible ?? false)
  const [faceVisible, setFaceVisible] = useState(video.quality?.face_visible ?? false)
  const [handsClear, setHandsClear] = useState(video.quality?.hands_clear ?? false)
  const [faceClear, setFaceClear] = useState(video.quality?.face_clear ?? false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch(`${API_BASE}/api/v1/videos/${video.sample_id}/metadata`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify({ 
          reasoning: notes,
          hands_visible: handsVisible,
          face_visible: faceVisible,
          hands_clear: handsClear,
          face_clear: faceClear
        }),
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

  const CheckboxField = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center space-x-2">
      <input 
        type="checkbox" 
        id={id} 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-gray-300 text-[#0A56D9] focus:ring-[#0A56D9]"
      />
      <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#001D4A]">
        {label}
      </label>
    </div>
  )

  return (
    <Card className="rounded-[20px] shadow-sm ring-1 ring-border/50 border-none">
      <CardHeader className="pb-2 flex flex-row items-center gap-2 pt-3 px-4">
        <BookText className="size-5 text-[#0A56D9]" />
        <CardTitle className="text-lg font-bold text-[#001D4A]">Details & Notes</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-2 flex flex-col gap-4">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-1">
          <CheckboxField id="handsVisible" label="Hands Visible" checked={handsVisible} onChange={setHandsVisible} />
          <CheckboxField id="faceVisible" label="Face Visible" checked={faceVisible} onChange={setFaceVisible} />
          <CheckboxField id="handsClear" label="Hands Clear" checked={handsClear} onChange={setHandsClear} />
          <CheckboxField id="faceClear" label="Face Clear" checked={faceClear} onChange={setFaceClear} />
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <label className="text-sm font-bold text-[#001D4A]">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tulis Notes untuk gerakan ini..."
            className="min-h-[80px] resize-y bg-[#F8FAFC] border-border/80 focus-visible:ring-[#0A56D9]/20 focus-visible:border-[#0A56D9] text-sm leading-relaxed p-3"
          />
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-600">{error}</p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-end gap-3 pt-1 px-4 pb-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="size-4" />
            Tersimpan
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#0A56D9] hover:bg-[#0848B8] text-white gap-2 rounded-xl h-9 px-5 text-sm font-semibold transition-all shadow-sm"
        >
          <Save className="size-4" strokeWidth={2.5} />
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </CardFooter>
    </Card>
  )
}
