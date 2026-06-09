'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store/useUserStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SetupPage() {
  const router = useRouter()
  const { name: storeName, gender: storeGender, setUser } = useUserStore()
  
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (storeName && storeGender) {
      setName(storeName)
      setGender(storeGender)
    }
  }, [storeName, storeGender])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && gender) {
      setUser(name.trim(), gender)
      router.push('/upload')
    }
  }

  if (!isMounted) return null

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] p-4 items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-[#001D4A]">
            Identitas Pengguna
          </CardTitle>
          <CardDescription>
            Silakan masukkan nama dan gender Anda sebelum melanjutkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama Anda"
                required
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#001D4A] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="gender" className="text-sm font-medium text-slate-700">
                Gender
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001D4A] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Pilih gender</option>
                <option value="male">Laki-laki (Male)</option>
                <option value="female">Perempuan (Female)</option>
              </select>
            </div>

            <Button type="submit" className="w-full bg-[#001D4A] hover:bg-[#001D4A]/90 text-white">
              Lanjut
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
