import Link from 'next/link'
import { ArrowLeft, Shapes, CheckCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SourcePicker } from '../_components/source-picker'

export const metadata = {
  title: 'Pilih Sumber Video | Aksa Capture',
  description: 'Pilih sumber video Anda',
}

interface PageProps {
  searchParams: Promise<{
    type?: string
    label?: string
    is_correct?: string
  }>
}

export default async function SourcePage({ searchParams }: PageProps) {
  const sp = await searchParams
  const type = sp.type || 'huruf'
  const label = sp.label || ''
  const isCorrect = sp.is_correct === 'true'

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Link>

        {/* Ringkasan Pilihan */}
        <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm border border-border/50">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Ringkasan Label
          </h2>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-[#001D4A] uppercase">
                {label}
              </span>
              <div className="flex flex-col gap-2 items-end">
                <Badge variant="secondary" className="bg-[#E6F0FF] text-[#0A56D9] border-transparent font-bold">
                  <Shapes className="size-3.5 mr-1.5" />
                  {type === 'huruf' ? 'Huruf' : 'Kata'}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}
                >
                  {isCorrect ? <CheckCircle className="size-3.5 mr-1.5" /> : <XCircle className="size-3.5 mr-1.5" />}
                  {isCorrect ? 'Gerakan Benar' : 'Gerakan Salah'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#001D4A]">
            Sumber Video
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rekam langsung dari kamera atau pilih file video dari perangkat Anda.
          </p>
        </div>

        <SourcePicker />
      </div>
    </div>
  )
}
