'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store/useUserStore'

export default function Home() {
  const router = useRouter()
  const { name, gender } = useUserStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      if (name && gender) {
        router.replace('/upload')
      } else {
        router.replace('/setup')
      }
    }
  }, [mounted, name, gender, router])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-[#001D4A] border-t-transparent animate-spin" />
    </div>
  )
}
