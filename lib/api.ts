const API_BASE =
  process.env.NEXT_PUBLIC_API_URL

const COMMON_HEADERS = {
  'ngrok-skip-browser-warning': '1',
  'Content-Type': 'application/json',
}

// ────────────────────────── Types ──────────────────────────
export interface Video {
  id: string
  video_path: string
  video_url: string
  label: string
  type: string
  is_correct: boolean
  notes: string | null
  created_at: string
}

export interface VideosMeta {
  current_page: number
  limit: number
  total_items: number
  total_pages: number
}

export interface VideosListResponse {
  data: Video[] | null
  meta: VideosMeta
}

export interface VideoDetailResponse {
  data: Video
}

// ────────────────────────── Fetch helpers ──────────────────
export async function getVideos(params: {
  type: string
  label: string
  page?: number
  limit?: number
  is_correct?: boolean
}): Promise<VideosListResponse> {
  const url = new URL(`${API_BASE}/api/v1/videos`)
  url.searchParams.set('type', params.type)
  url.searchParams.set('label', params.label)
  url.searchParams.set('page', String(params.page ?? 1))
  url.searchParams.set('limit', String(params.limit ?? 20))
  if (params.is_correct !== undefined) {
    url.searchParams.set('is_correct', String(params.is_correct))
  }

  const res = await fetch(url.toString(), {
    headers: COMMON_HEADERS,
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch videos: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<VideosListResponse>
}

export async function getVideoById(id: string): Promise<VideoDetailResponse> {
  const res = await fetch(`${API_BASE}/api/v1/videos/${id}`, {
    headers: COMMON_HEADERS,
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<VideoDetailResponse>
}

// ────────────────────────── Upload helpers ──────────────────
export async function getUploadUrl(params: {
  type: string
  label: string
}): Promise<{ id: string; video_path: string; upload_url: string }> {
  const res = await fetch(`${API_BASE}/api/v1/upload-url`, {
    method: 'POST',
    headers: COMMON_HEADERS,
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`Failed to get upload URL: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export async function uploadVideoToCloud(
  uploadUrl: string, 
  file: File, 
  mimeType: string
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
    },
    body: file,
  })

  if (!res.ok) {
    throw new Error(`Failed to upload to cloud: ${res.status} ${res.statusText}`)
  }
}

export async function createVideoMetadata(params: {
  id: string
  video_path: string
  label: string
  type: string
  is_correct: boolean
  notes?: string
}): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/videos`, {
    method: 'POST',
    headers: COMMON_HEADERS,
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`Failed to create video metadata: ${res.status} ${res.statusText}`)
  }

  return res.json()
}
