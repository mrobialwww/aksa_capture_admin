/**
 * Module-level store for the pending video Blob.
 *
 * Why not sessionStorage?
 * sessionStorage can only hold strings (blob URLs), not the actual Blob data.
 * On mobile browsers (Android Chrome), in-memory Blobs created by MediaRecorder
 * can be garbage-collected even when a blob URL still exists, causing
 * "Video tidak dapat dimuat" errors on the preview page.
 *
 * By holding a strong JS reference to the Blob here (module scope), we prevent
 * GC from collecting it across client-side navigations (router.push).
 * This reference is cleared explicitly after the video is uploaded.
 */

interface PendingVideo {
    blob: Blob;
    url: string; // the object URL created from blob
    name: string;
    mimeType: string;
    durationSec?: number;
}

let _pending: PendingVideo | null = null;

/** Store a blob and return its stable object URL. */
export function setPendingVideo(
    blob: Blob,
    name: string,
    mimeType: string,
    durationSec?: number,
): string {
    // Revoke previous URL to free memory
    if (_pending) {
        URL.revokeObjectURL(_pending.url);
    }
    const url = URL.createObjectURL(blob);
    _pending = { blob, url, name, mimeType, durationSec };

    // Also mirror to sessionStorage so server-side fallback & metadata reads still work
    sessionStorage.setItem("pendingVideoUrl", url);
    sessionStorage.setItem("pendingVideoName", name);
    sessionStorage.setItem("pendingVideoType", mimeType);

    return url;
}

/** Retrieve the pending video, or null if none exists. */
export function getPendingVideo(): PendingVideo | null {
    return _pending;
}

/** Return the pending video as a File (for upload). */
export function getPendingVideoAsFile(): File | null {
    if (!_pending) return null;
    return new File([_pending.blob], _pending.name, { type: _pending.mimeType });
}

/** Clear the store and revoke the object URL. Call after successful upload. */
export function clearPendingVideo(): void {
    if (_pending) {
        URL.revokeObjectURL(_pending.url);
        _pending = null;
    }
    sessionStorage.removeItem("pendingVideoUrl");
    sessionStorage.removeItem("pendingVideoName");
    sessionStorage.removeItem("pendingVideoType");
}
