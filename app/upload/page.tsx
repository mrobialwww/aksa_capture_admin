import Link from 'next/link'
import { CategorySelector } from './_components/category-selector'
import { Library } from 'lucide-react'

export const metadata = {
  title: 'Upload Video | Aksa Capture',
  description: 'Rekam dan unggah video gerakan BISINDO',
}

export default function UploadPage() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-end">
        <Link 
          href="/upload/gallery"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Library className="size-4 text-[#0A56D9]" />
          Lihat Galeri Upload
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <CategorySelector />
      </div>
    </div>
  )
}
