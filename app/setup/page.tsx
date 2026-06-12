'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store/useUserStore'
import { Button } from '@/components/ui/button'
import { UserCircle2, Info, ArrowRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SetupPage() {
  const router = useRouter()
  const { name: storeName, gender: storeGender, setUser } = useUserStore()
  
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (storeName && storeGender) {
      router.replace('/upload')
    }
  }, [storeName, storeGender, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && gender) {
      setUser(name.trim(), gender)
      router.push('/upload')
    }
  }

  if (!isMounted) return null

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50 p-4 font-sans relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 w-full h-[300px] bg-linear-to-b from-[#0A56D9]/10 to-transparent -z-10" />
      <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-[#0A56D9]/5 blur-3xl -z-10" />
      <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#0A56D9]/5 blur-3xl -z-10" />

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        
        {/* Header Icon & Text */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="size-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-5 ring-4 ring-slate-500/5">
            <UserCircle2 className="size-8 text-[#0A56D9]" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#001D4A] mb-2">
            Identitas Kontributor
          </h1>
          <p className="text-slate-500 text-sm max-w-[300px]">
            Lengkapi data diri Anda terlebih dahulu sebelum mulai merekam dataset bahasa isyarat.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100/60 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Name Input Section */}
            <div className="space-y-3">
              <label htmlFor="name" className="text-sm font-bold text-slate-700 block">
                Nama Lengkap
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ketik nama lengkap Anda..."
                  required
                  className="w-full h-14 rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 text-base font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#0A56D9] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0A56D9]/10"
                />
              </div>
              
              {/* Disclaimer */}
              <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                <Info className="size-4 shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">
                  Nama harus sesuai dengan data diri (Misalnya KTP/KK). Data ini digunakan untuk validasi dataset.
                </p>
              </div>
            </div>
            
            {/* Gender Selection Section */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 block">
                Jenis Kelamin
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border-2 transition-all duration-200",
                    gender === 'male'
                      ? "border-[#0A56D9] bg-[#0A56D9]/5 text-[#0A56D9] ring-4 ring-[#0A56D9]/10"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="relative">
                    <span className="text-2xl">👨🏻</span>
                    {gender === 'male' && (
                      <CheckCircle2 className="absolute -bottom-1 -right-2 size-4 text-[#0A56D9] bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-sm font-bold">Laki-laki</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border-2 transition-all duration-200",
                    gender === 'female'
                      ? "border-[#0A56D9] bg-[#0A56D9]/5 text-[#0A56D9] ring-4 ring-[#0A56D9]/10"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="relative">
                    <span className="text-2xl">👩🏻</span>
                    {gender === 'female' && (
                      <CheckCircle2 className="absolute -bottom-1 -right-2 size-4 text-[#0A56D9] bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-sm font-bold">Perempuan</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={!name.trim() || !gender}
              className="w-full h-14 rounded-2xl bg-[#0A56D9] hover:bg-[#0848B8] text-white font-bold text-base shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
            >
              Mulai Kontribusi Dataset
              <ArrowRight className="ml-2 size-5" />
            </Button>
            
          </form>
        </div>
      </div>
    </div>
  )
}
