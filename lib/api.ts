const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const COMMON_HEADERS = {
    "ngrok-skip-browser-warning": "1",
    "Content-Type": "application/json",
};

// ────────────────────────── Types ──────────────────────────
export interface Video {
    sample_id: string;
    task_type: string[];
    created_at: string;
    media: {
        video_path: string;
        video_url?: string;
        duration_sec: number;
        resolution_width: number;
        resolution_height: number;
        capture_location: string;
    };
    label: {
        gesture_type: string;
        gesture_name: string;
        target_id: string;
        bisindo_region: string;
        bisindo_subregion: string;
        is_correct: boolean;
        error_category: string | null;
        validated_by: string | null;
        reasoning: string | null;
    };
    signer: {
        signer_name: string;
        gender: string;
    };
    quality: {
        hands_visible: boolean;
        face_visible: boolean;
        hands_clear: boolean;
        face_clear: boolean;
    };
}

export interface VideosMeta {
    current_page: number;
    limit: number;
    total_items: number;
    total_pages: number;
}

export interface VideosListResponse {
    data: Video[] | null;
    meta: VideosMeta;
}

export interface VideoDetailResponse {
    data: Video;
}

export interface BatchVideoMetadataItem {
    sample_id: string;
    video_path: string;
    video_url: string;
    name: string;
    gender: string;
    gesture_type: string;
    gesture_name: string;
    is_correct: boolean;
    error_category?: string;
    capture_location: string;
}

export interface BatchCreateResult {
    results: {
        sample_id: string;
        status: "success" | "error";
        message?: string;
    }[];
}

// ────────────────────────── Fetch helpers ──────────────────
export async function getVideos(params: {
    type: string;
    label: string;
    page?: number;
    limit?: number;
    is_correct?: boolean;
    signer_name?: string;
}): Promise<VideosListResponse> {
    const url = new URL(`${API_BASE}/api/v1/videos`);
    url.searchParams.set("type", params.type);
    url.searchParams.set("label", params.label);
    url.searchParams.set("page", String(params.page ?? 1));
    url.searchParams.set("limit", String(params.limit ?? 20));
    if (params.is_correct !== undefined) {
        url.searchParams.set("is_correct", String(params.is_correct));
    }
    if (params.signer_name) {
        url.searchParams.set("signer_name", params.signer_name);
    }

    const res = await fetch(url.toString(), {
        headers: COMMON_HEADERS,
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(
            `Failed to fetch videos: ${res.status} ${res.statusText}`,
        );
    }

    return res.json() as Promise<VideosListResponse>;
}

export async function getVideoById(id: string): Promise<VideoDetailResponse> {
    const res = await fetch(`${API_BASE}/api/v1/videos/${id}`, {
        headers: COMMON_HEADERS,
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(
            `Failed to fetch video: ${res.status} ${res.statusText}`,
        );
    }

    return res.json() as Promise<VideoDetailResponse>;
}

// ────────────────────────── Upload helpers ──────────────────
export async function getUploadUrl(params: {
    type: string;
    label: string;
}): Promise<{
    sample_id: string;
    video_path: string;
    upload_url: string;
    video_url: string;
}> {
    const res = await fetch(`${API_BASE}/api/v1/upload-url`, {
        method: "POST",
        headers: COMMON_HEADERS,
        body: JSON.stringify(params),
    });

    if (!res.ok) {
        throw new Error(
            `Failed to get upload URL: ${res.status} ${res.statusText}`,
        );
    }

    return res.json();
}

export async function uploadVideoToCloud(
    uploadUrl: string,
    file: File,
    mimeType: string,
): Promise<void> {
    const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": mimeType,
        },
        body: file,
    });

    if (!res.ok) {
        throw new Error(
            `Failed to upload to cloud: ${res.status} ${res.statusText}`,
        );
    }
}

export async function createVideoMetadata(params: {
    sample_id: string;
    video_path: string;
    video_url: string;
    name: string;
    gender: string;
    gesture_type: string;
    gesture_name: string;
    is_correct: boolean;
    error_category?: string;
    capture_location: string;
    duration_sec: number;
    resolution_width: number;
    resolution_height: number;
}): Promise<{ message: string }> {
    const payload = {
        sample_id: params.sample_id,
        media: {
            video_path: params.video_path,
            video_url: params.video_url,
            duration_sec: params.duration_sec,
            resolution: {
                width: params.resolution_width,
                height: params.resolution_height,
            },
            capture_location: params.capture_location,
        },
        label: {
            gesture_type: params.gesture_type,
            gesture_name: params.gesture_name,
            bisindo_region_version: {
                region: "Jawa Timur",
                subregion: "Malang",
            },
            is_correct: params.is_correct,
            error_category: params.error_category || null,
        },
        signer: {
            signer_name: params.name,
            gender:
                params.gender === "laki-laki" || params.gender === "male"
                    ? "male"
                    : "female",
        },
    };

    const res = await fetch(`${API_BASE}/api/v1/videos`, {
        method: "POST",
        headers: COMMON_HEADERS,
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error(
            `Failed to create video metadata: ${res.status} ${res.statusText}`,
        );
    }

    return res.json();
}

export async function deleteVideo(
    sampleId: string,
): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/api/v1/videos/${sampleId}`, {
        method: "DELETE",
        headers: COMMON_HEADERS,
    });

    if (!res.ok) {
        throw new Error(
            `Failed to delete video: ${res.status} ${res.statusText}`,
        );
    }

    return res.json();
}

// ────────────────────────── Batch Upload ───────────────────

export interface BatchUploadUrlItem {
    sample_id: string;
    video_path: string;
    upload_url: string;
    video_url: string;
}

/** Generate presigned upload URLs for up to 20 videos at once. */
export async function getBatchUploadUrls(
    items: { type: string; label: string }[],
): Promise<{ data: BatchUploadUrlItem[] }> {
    const res = await fetch(`${API_BASE}/api/v1/upload-url/batch`, {
        method: "POST",
        headers: COMMON_HEADERS,
        body: JSON.stringify({ items }),
    });

    if (!res.ok) {
        throw new Error(
            `Failed to get batch upload URLs: ${res.status} ${res.statusText}`,
        );
    }

    return res.json();
}

/** Save metadata for multiple videos at once (max 20). */
export async function createBatchVideoMetadata(
    params: BatchVideoMetadataItem[],
): Promise<BatchCreateResult> {
    const items = params.map((p) => ({
        sample_id: p.sample_id,
        media: {
            video_path: p.video_path,
            video_url: p.video_url,
            capture_location: p.capture_location,
        },
        label: {
            gesture_type: p.gesture_type,
            gesture_name: p.gesture_name,
            bisindo_region_version: {
                region: "Jawa Timur",
                subregion: "Malang",
            },
            is_correct: p.is_correct,
            error_category: p.error_category || null,
        },
        signer: {
            signer_name: p.name,
            gender:
                p.gender === "laki-laki" || p.gender === "male"
                    ? "male"
                    : "female",
        },
    }));

    const res = await fetch(`${API_BASE}/api/v1/videos/batch`, {
        method: "POST",
        headers: COMMON_HEADERS,
        body: JSON.stringify({ items }),
    });

    if (!res.ok) {
        throw new Error(
            `Failed to create batch video metadata: ${res.status} ${res.statusText}`,
        );
    }

    return res.json();
}
