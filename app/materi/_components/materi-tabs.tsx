'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { HurufCard } from './huruf-card'
import { KataCard } from './kata-card'

const HURUF_LIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const KATA_LIST = [
    'selamat sore',
    'selamat siang',
    'salam kenal',
    'sayang',
    'marah',
    'mana',
    'saya',
    'dari',
    'berasal',
    'siapa',
    'kamu',
    'perkenalkan',
    'kabar',
    'nama',
    'apa',
    'halo',
    'selamat malam',
    'selamat pagi',
    'aku',
  ]

export function MateriTabs() {
  const [tab, setTab] = useState<string>('huruf')
  const [gerakanTab, setGerakanTab] = useState<'benar' | 'salah'>('benar')

  // Load state dari localStorage saat pertama kali mount
  useEffect(() => {
    const savedTab = localStorage.getItem('materi-active-tab')
    if (savedTab === 'huruf' || savedTab === 'kata') setTab(savedTab)

    const savedGerakan = localStorage.getItem('materi-gerakan-tab')
    if (savedGerakan === 'benar' || savedGerakan === 'salah') setGerakanTab(savedGerakan)
  }, [])

  const handleTabChange = (val: string) => {
    setTab(val)
    localStorage.setItem('materi-active-tab', val)
  }

  const handleGerakanChange = (val: 'benar' | 'salah') => {
    setGerakanTab(val)
    localStorage.setItem('materi-gerakan-tab', val)
  }

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="flex flex-col gap-8">
      {/* Top Controls */}
      <div className="flex flex-col gap-6">
        <TabsList className="w-fit rounded-xl bg-muted/50 p-1">
          <TabsTrigger id="tab-huruf" value="huruf" className="rounded-lg px-8 py-1.5 font-semibold">
            Huruf
          </TabsTrigger>
          <TabsTrigger id="tab-kata" value="kata" className="rounded-lg px-8 py-1.5 font-semibold">
            Kata
          </TabsTrigger>
        </TabsList>

        {/* Gerakan Benar / Gerakan Salah — global filter */}
        <div className="flex items-center gap-3">
          <Button
            id="gerakan-benar-global"
            variant="outline"
            size="sm"
            onClick={() => handleGerakanChange('benar')}
            className={cn(
              'gap-2 rounded-full px-4 py-4 text-xs font-bold transition-all shadow-none',
              gerakanTab === 'benar'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                : 'text-muted-foreground/70 border-border/60 bg-transparent hover:bg-muted/50'
            )}
          >
            <CheckCircle className="size-4" strokeWidth={2.5} />
            Gerakan Benar
          </Button>
          <Button
            id="gerakan-salah-global"
            variant="outline"
            size="sm"
            onClick={() => handleGerakanChange('salah')}
            className={cn(
              'gap-2 rounded-full px-4 py-4 text-xs font-bold transition-all shadow-none',
              gerakanTab === 'salah'
                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                : 'text-muted-foreground/70 border-border/60 bg-transparent hover:bg-muted/50'
            )}
          >
            <XCircle className="size-4" strokeWidth={2.5} />
            Gerakan Salah
          </Button>
        </div>
      </div>

      {/* ── Huruf Content ── */}
      <TabsContent value="huruf" className="mt-0 outline-none">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {HURUF_LIST.map((letter) => (
            <HurufCard key={letter} letter={letter} gerakanTab={gerakanTab} />
          ))}
        </div>
      </TabsContent>

      {/* ── Kata Content ── */}
      <TabsContent value="kata" className="mt-0 outline-none">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {KATA_LIST.map((word, index) => (
            <KataCard
              key={word}
              index={index}
              word={word}
              gerakanTab={gerakanTab}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
