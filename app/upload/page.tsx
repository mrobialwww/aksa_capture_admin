import { CategorySelector } from './_components/category-selector'

export const metadata = {
  title: 'Upload Video | Aksa Capture',
  description: 'Rekam dan unggah video gerakan BISINDO',
}

export default function UploadPage() {
  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#001D4A]">
            Pilih Kategori
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tentukan jenis dan status gerakan yang akan Anda rekam.
          </p>
        </div>
        
        <CategorySelector />
      </div>
    </div>
  )
}
