'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const HURUF_LIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const KATA_LIST = [
  'selamat sore', 'selamat siang', 'salam kenal', 'sayang', 'marah',
  'mana', 'saya', 'dari', 'berasal', 'siapa', 'kamu', 'perkenalkan',
  'kabar', 'nama', 'apa', 'halo', 'selamat malam', 'selamat pagi', 'aku'
]

export function CategorySelector() {
  const router = useRouter()
  const [type, setType] = useState<'huruf' | 'kata'>('huruf')
  const [label, setLabel] = useState<string>('')
  const [isCorrect, setIsCorrect] = useState<boolean>(true)

  const handleNext = () => {
    if (!label) return
    
    // Save to url params and navigate
    const params = new URLSearchParams()
    params.set('type', type)
    params.set('label', label)
    params.set('is_correct', String(isCorrect))
    
    router.push(`/upload/source?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Top Controls */}
      <div className="flex flex-col gap-8">
        
        {/* 1. Pilih Jenis Gerakan */}
        <div className="flex flex-col gap-4">
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            1. Pilih Jenis Gerakan
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCorrect(true)}
              className={cn(
                "flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-all border shadow-sm",
                isCorrect
                  ? "bg-emerald-50 text-emerald-600 border-emerald-300 ring-4 ring-emerald-500/10"
                  : "bg-white text-muted-foreground/70 border-border/80 hover:bg-slate-50 hover:text-foreground"
              )}
            >
              <CheckCircle className="size-5" strokeWidth={2.5} />
              Gerakan Benar
            </button>
            <button
              onClick={() => setIsCorrect(false)}
              className={cn(
                "flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-all border shadow-sm",
                !isCorrect
                  ? "bg-red-50 text-red-600 border-red-300 ring-4 ring-red-500/10"
                  : "bg-white text-muted-foreground/70 border-border/80 hover:bg-slate-50 hover:text-foreground"
              )}
            >
              <XCircle className="size-5" strokeWidth={2.5} />
              Gerakan Salah
            </button>
          </div>
        </div>

        {/* 2. Pilih Huruf / Kata */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              2. Pilih {type === 'huruf' ? 'Huruf' : 'Kata'}
            </span>
          </div>
          
          <Tabs value={type} onValueChange={(v) => { setType(v as any); setLabel('') }}>
            <TabsList className="w-fit bg-white px-2 py-6 mb-6 rounded-xl border border-border/60 shadow-sm">
              <TabsTrigger value="huruf" className="rounded-lg px-8 py-4 font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                Huruf
              </TabsTrigger>
              <TabsTrigger value="kata" className="rounded-lg px-8 py-4 font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                Kata
              </TabsTrigger>
            </TabsList>

            <TabsContent value="huruf" className="mt-0 outline-none">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {HURUF_LIST.map((h) => (
                  <button
                    key={h}
                    onClick={() => setLabel(h)}
                    className={cn(
                      "flex h-16 items-center justify-center rounded-2xl border-2 text-2xl font-black transition-all shadow-sm",
                      label === h
                        ? "border-[#0A56D9] bg-[#0A56D9]/10 text-[#0A56D9] ring-4 ring-[#0A56D9]/10"
                        : "border-border/60 bg-white text-foreground hover:border-[#0A56D9]/40 hover:bg-[#0A56D9]/5"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="kata" className="mt-0 outline-none">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {KATA_LIST.map((k) => (
                  <button
                    key={k}
                    onClick={() => setLabel(k)}
                    className={cn(
                      "flex min-h-16 items-center px-5 rounded-2xl border-2 text-base font-bold capitalize transition-all shadow-sm",
                      label === k
                        ? "border-[#0A56D9] bg-[#0A56D9]/10 text-[#0A56D9] ring-4 ring-[#0A56D9]/10"
                        : "border-border/60 bg-white text-foreground hover:border-[#0A56D9]/40 hover:bg-[#0A56D9]/5"
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 3. Lanjut */}
      {label && (
        <div className="pt-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-300 flex justify-end">
          <Button
            onClick={handleNext}
            className="w-full sm:w-auto px-10 rounded-2xl h-14 bg-[#0A56D9] text-white font-bold text-lg hover:bg-[#0848B8] shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            Lanjut ke Rekam Video
            <ArrowRight className="ml-2 size-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
