# Aksa Capture — App Flow Documentation

> Dokumen ini menjelaskan **alur lengkap aplikasi Aksa Capture** dari sudut pandang teknis dan UX. Ditujukan bagi developer yang baru bergabung agar bisa memahami struktur, routing, dan data flow secara menyeluruh.

---

## 1. Tech Stack Ringkas

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State antar halaman | `sessionStorage` (untuk blob URL video) |
| State dalam halaman | React `useState` |
| API Client | `lib/api.ts` (native `fetch`) |
| Store global | Zustand (`useUserStore`) |
| Notifikasi | `sonner` (toast) |

---

## 2. Struktur Routing

```
app/
├── page.tsx                        → Redirect ke /upload
├── setup/                          → Halaman isi nama & jenis kelamin (onboarding)
├── materi/[type]/[slug]/           → Halaman lihat video (browser dataset)
└── upload/
    ├── layout.tsx                  → Layout umum (sidebar navigasi upload)
    ├── page.tsx                    → Step 1: Pilih Kategori
    ├── source/
    │   └── page.tsx                → Step 2: Pilih Sumber Video
    ├── edit/
    │   └── page.tsx                → Step 3: Editor Video (Trim / Rotate / Mute)
    └── preview/
        └── page.tsx                → Step 4: Preview & Upload ke server
```

Semua **parameter metadata** (jenis, label, is_correct, capture_location) diteruskan antar halaman melalui **URL query string**, sehingga halaman mana pun bisa dibookmark atau di-refresh tanpa kehilangan konteks.

File video itu sendiri tidak bisa dimasukkan ke URL; ia disimpan sementara di **`sessionStorage`** sebagai `blob:` URL.

---

## 3. Diagram Alur Lengkap

```mermaid
flowchart TD
    A([Buka Aplikasi]) --> B{Sudah isi\nnama & gender?}
    B -- Belum --> S[/setup/\nIsi Profil Pengguna]
    S --> C
    B -- Sudah --> C

    C[/upload/\nStep 1: Pilih Kategori] --> C1[Pilih Jenis Gerakan\nBenar / Salah]
    C1 --> C2[Pilih Lokasi\nIndoor / Outdoor]
    C2 --> C3[Pilih Label\nHuruf A–Z atau Kata]
    C3 --> C4{Label dipilih?}
    C4 -- Belum --> C3
    C4 -- Ya --> D

    D[/upload/source/\nStep 2: Pilih Sumber Video]
    D --> D1{Sumber?}
    D1 -- Rekam Kamera --> D2[CameraRecorder\nbuka kamera browser]
    D1 -- Pilih dari Galeri --> D3[input file\nvideo/*]
    D2 --> D4[File video tersedia]
    D3 --> D4

    D4 --> D5[Simpan blob URL\nke sessionStorage]
    D5 --> E

    E[/upload/edit/\nStep 3: Editor Video\nVideoEditor component]
    E --> E1[Load video\ndari sessionStorage]
    E1 --> E2{Edit video?}
    E2 -- Trim saja --> E3[Drag handle\ntimeline kiri/kanan]
    E2 -- Rotate --> E4[Klik tombol putar\n+90° searah jarum jam]
    E2 -- Mute audio --> E5[Toggle tombol speaker]
    E2 -- Skip / tidak edit --> F
    E3 --> E6[Terapkan & Lanjut]
    E4 --> E6
    E5 --> E6
    E6 --> E7[MediaRecorder + Canvas\nrender video baru]
    E7 --> E8[Simpan blob URL baru\nke sessionStorage]
    E8 --> F

    F[/upload/preview/\nStep 4: Preview & Upload\nUploadProgress component]
    F --> F1[Load video\ndari sessionStorage]
    F1 --> F2[Putar video preview]
    F2 --> F3[Klik Upload Video]

    F3 --> G1[Step: Persiapan\nAmbil blob → buat File object\nEkstrak metadata video]
    G1 --> G2[Step: Minta URL\nPOST /api/v1/upload-url]
    G2 --> G3[Step: Upload\nPUT ke Cloudflare R2\ngunakan pre-signed URL]
    G3 --> G4[Step: Simpan\nPOST /api/v1/videos\nkirim full metadata]
    G4 --> G5{Berhasil?}

    G5 -- Ya --> H[Hapus sessionStorage\nToast sukses\nRedirect ke /upload]
    G5 -- Gagal --> I[Tampilkan error\nBoleh coba ulang]
```

---

## 4. Penjelasan Per Halaman

### Step 0 — Setup (`/setup`)

**Tujuan:** Onboarding awal untuk mengisi identitas pengguna yang disimpan secara persisten menggunakan Zustand + `localStorage`.

- Field: **Nama** dan **Jenis Kelamin** (laki-laki / perempuan)
- Data ini akan digunakan pada payload `signer` saat upload
- Jika sudah terisi, pengguna langsung diarahkan ke `/upload`

---

### Step 1 — Pilih Kategori (`/upload`)

**File:** `app/upload/page.tsx` → render `CategorySelector`  
**Komponen:** `app/upload/_components/category-selector.tsx`

**Urutan interaksi:**
1. **Pilih Jenis Gerakan** — `Gerakan Benar` (hijau) atau `Gerakan Salah` (merah)
2. **Pilih Lokasi** — `Indoor` atau `Outdoor`
3. **Pilih Label** — Tab *Huruf* (A–Z) atau *Kata* (dari `KATA_LIST`)

Begitu label dipilih, tombol **"Lanjut ke Rekam Video"** muncul di pojok kanan atas dengan animasi `fade-in slide-in-from-right`.

**Navigasi:**
```
router.push(`/upload/source?type=letter&label=A&is_correct=true&capture_location=indoor`)
```

> **Catatan penting:** `type` yang dikirim ke halaman berikutnya masih berupa `huruf`/`kata` (dalam Bahasa Indonesia). Konversi ke `letter`/`word` dilakukan di `upload-progress.tsx` sebelum memanggil API.

---

### Step 2 — Pilih Sumber Video (`/upload/source`)

**File:** `app/upload/source/page.tsx` → render `SourcePicker`  
**Komponen:** `app/upload/_components/source-picker.tsx`

Ada dua pilihan sumber:

| Pilihan | Implementasi |
|---|---|
| **Rekam Kamera** | Render `CameraRecorder` yang menggunakan `getUserMedia` + `MediaRecorder` |
| **Pilih dari Galeri** | `<input type="file" accept="video/*">` yang dipicu secara programatik |

**Alur setelah video tersedia:**
1. Validasi ukuran file (maks 100 MB)
2. Buat `blob:` URL dari file dengan `URL.createObjectURL(file)`
3. Simpan ke `sessionStorage`:
   ```ts
   sessionStorage.setItem('pendingVideoUrl', objectUrl)   // blob: URL
   sessionStorage.setItem('pendingVideoName', file.name)
   sessionStorage.setItem('pendingVideoType', file.type)
   ```
4. Redirect ke `/upload/edit?...` (query string diteruskan utuh)

---

### Step 3 — Editor Video (`/upload/edit`)

**File:** `app/upload/edit/page.tsx` → render `VideoEditor`  
**Komponen:** `app/upload/_components/video-editor.tsx`

Ini adalah halaman opsional untuk mengedit video sebelum di-upload.

#### Fitur yang Tersedia

| Fitur | Cara Pakai |
|---|---|
| **Trim** | Drag handle biru di kiri/kanan timeline untuk ubah titik awal & akhir |
| **Rotate** | Klik tombol `RotateCw` → video berputar 90° searah jarum jam, bisa diklik berkali-kali |
| **Mute Audio** | Toggle tombol speaker; jika aktif, audio tidak direkam ke file output |
| **Play/Pause** | Preview video hanya pada segmen yang sudah di-trim |
| **Lewati Edit** | Langsung lanjut ke `/upload/preview` tanpa mengubah video |

#### Proses Ekspor (saat klik "Terapkan & Lanjut")

Fungsi `handleExport` di `video-editor.tsx` bekerja sebagai berikut:

```
1. Jika rotation !== 0:
   - Buat offscreen <canvas> dengan dimensi yang disesuaikan
   - Loop requestAnimationFrame → gambar video dengan rotasi ke canvas
   - Ambil stream dari canvas.captureStream(30)
   - Tambahkan audio track dari video asli jika tidak muted

2. Jika rotation === 0:
   - Ambil stream langsung dari video.captureStream()
   - Hapus audio track jika muted

3. Buat MediaRecorder dari stream, rekam dari startTime ke endTime

4. Setelah selesai:
   - Buat Blob dari chunks yang dikumpulkan
   - Buat blob URL baru → simpan ke sessionStorage (gantikan yang lama)
   - Redirect ke /upload/preview
```

> **⚠️ Keterbatasan Browser:** `captureStream()` dan `canvas.captureStream()` didukung oleh Chrome dan Edge. Firefox menggunakan `mozCaptureStream()` (di-handle juga). Safari **tidak** mendukung fitur ini.

---

### Step 4 — Preview & Upload (`/upload/preview`)

**File:** `app/upload/preview/page.tsx` → render `UploadProgress`  
**Komponen:** `app/upload/_components/upload-progress.tsx`

Halaman ini menampilkan video preview dan menangani seluruh proses upload ke backend.

#### Urutan Upload (fungsi `handleUpload`)

```
Step 1 — Persiapan
  - Ambil blob URL dari sessionStorage
  - fetch(blobUrl) → Blob → File object
  - Ekstrak duration_sec, width, height via <video> element

Step 2 — Minta URL (POST /api/v1/upload-url)
  Body: { type: "letter"|"word", label: "A" }
  Response: { sample_id, video_path, video_url, upload_url }

Step 3 — Upload ke Cloud (PUT ke Cloudflare R2)
  - Gunakan upload_url yang berisi pre-signed signature
  - PUT dengan Content-Type sesuai MIME type video

Step 4 — Simpan Metadata (POST /api/v1/videos)
  Body: full JSON payload (lihat contoh di bawah)
```

#### Contoh Payload `POST /api/v1/videos`

```json
{
  "sample_id": "550e8400-e29b-41d4-a716-446655440000",
  "media": {
    "video_path": "Dataset/letter/A/record_1749646823000.mp4",
    "video_url": "https://pub-xxx.r2.dev/Dataset/letter/A/record_1749646823000.mp4",
    "duration_sec": 3.14,
    "resolution": {
      "width": 1280,
      "height": 720
    },
    "capture_location": "indoor"
  },
  "label": {
    "gesture_type": "letter",
    "gesture_name": "A",
    "bisindo_region_version": {
      "region": "Jawa Timur",
      "subregion": "Malang"
    },
    "is_correct": true
  },
  "signer": {
    "signer_name": "Bintang",
    "gender": "female"
  }
}
```

> **Catatan:** `bisindo_region_version` saat ini **hardcoded** ke "Jawa Timur" / "Malang" di `lib/api.ts`. Jika perlu mengakomodasi region lain, nilai ini harus dijadikan konfigurasi atau ditambahkan sebagai pilihan di UI.

#### State UI Upload Progress

```
idle → siap → url → upload → simpan → success
                                     ↘ error (bisa retry)
```

Setelah `success`, `sessionStorage` dibersihkan dan pengguna diarahkan kembali ke `/upload` dalam 1,5 detik.

---

## 5. Data Flow: sessionStorage

`sessionStorage` digunakan sebagai "jembatan" sementara untuk membawa file video antar halaman karena tidak bisa diteruskan via URL atau props komponen server.

| Key | Isi | Dibuat di | Dihapus di |
|---|---|---|---|
| `pendingVideoUrl` | `blob:` URL ke file video | `source-picker.tsx` / `video-editor.tsx` | `upload-progress.tsx` (setelah sukses) |
| `pendingVideoName` | Nama file (string) | `source-picker.tsx` / `video-editor.tsx` | `upload-progress.tsx` |
| `pendingVideoType` | MIME type (string) | `source-picker.tsx` / `video-editor.tsx` | `upload-progress.tsx` |

> **⚠️ Perhatian Memory:** Setiap `blob:` URL yang dibuat dengan `URL.createObjectURL()` harus dibebaskan dengan `URL.revokeObjectURL()` agar tidak bocor. Ini sudah dilakukan di `upload-progress.tsx` setelah upload sukses. Namun jika pengguna meninggalkan halaman tanpa upload, blob URL lama akan tetap hidup hingga tab ditutup.

---

## 6. API Endpoints yang Digunakan

Semua fungsi API ada di `lib/api.ts`.

| Endpoint | Method | Fungsi | Dipanggil dari |
|---|---|---|---|
| `GET /api/v1/videos` | GET | Daftar video dataset | Halaman `materi/` |
| `GET /api/v1/videos/:id` | GET | Detail satu video | Halaman detail materi |
| `POST /api/v1/upload-url` | POST | Minta pre-signed upload URL | `upload-progress.tsx` |
| `PUT {upload_url}` | PUT | Upload video ke Cloudflare R2 | `upload-progress.tsx` |
| `POST /api/v1/videos` | POST | Simpan metadata video | `upload-progress.tsx` |

Base URL dikonfigurasi via environment variable:
```
NEXT_PUBLIC_API_URL=https://your-backend.example.com
```

---

## 7. Komponen Reusable

| Komponen | Lokasi | Fungsi |
|---|---|---|
| `CategorySelector` | `upload/_components/` | Form pilih kategori di Step 1 |
| `SourcePicker` | `upload/_components/` | Pilih kamera atau galeri di Step 2 |
| `CameraRecorder` | `upload/_components/` | UI rekam kamera langsung |
| `VideoEditor` | `upload/_components/` | Editor trim/rotate/mute di Step 3 |
| `UploadProgress` | `upload/_components/` | Preview + progress upload di Step 4 |
| `VideoPlayerPlaceholder` | `materi/[type]/[slug]/_components/` | Player video generik (dipakai juga di preview) |

---

## 8. Hal yang Perlu Diperhatikan Developer Baru

1. **Jangan gunakan `useRouter` dari `react-router-dom`** — proyek ini menggunakan Next.js App Router; gunakan `useRouter` dari `next/navigation`.

2. **`searchParams` di Server Component bersifat `Promise`** — harus di-`await` sebelum digunakan (Next.js 15).

3. **`VideoEditor` adalah Client Component** karena menggunakan Web API (`MediaRecorder`, `captureStream`, `sessionStorage`).

4. **Konversi tipe sebelum memanggil API:**
   - UI menggunakan `huruf`/`kata` (Bahasa Indonesia)
   - API backend mengharapkan `letter`/`word` (Bahasa Inggris)
   - Konversi dilakukan di `upload-progress.tsx`: `type.toLowerCase() === 'huruf' ? 'letter' : 'word'`

5. **`region` dan `subregion` masih hardcoded** di `lib/api.ts` baris 169–171. Jika dataset perlu mencakup wilayah lain, ini harus diubah.

6. **Rotasi video saat export**: menggunakan `canvas.captureStream()` yang hanya berjalan di Chrome/Edge. Pada browser lain yang tidak mendukung, proses export akan melempar error dan ditampilkan sebagai toast.
