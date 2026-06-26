/**
 * compress-video.ts
 *
 * Client-side video compression via canvas + MediaRecorder.
 * Matches the exact settings used in video-editor.tsx handleExport:
 *  - Max 720p (1280x720 landscape, 720x1280 portrait)
 *  - 30 fps
 *  - ~850 kbps video bitrate
 *  - WebM/VP8 output
 *
 * Can be used standalone without any React state.
 */

const TARGET_BITRATE = 850_000; // 850 kbps — same as video-editor
const TARGET_FPS = 30;

/** Re-encode a File/Blob to a compressed WebM Blob. */
export async function compressVideo(file: File): Promise<File> {
    return new Promise<File>((resolve, reject) => {
        const videoEl = document.createElement("video");
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.preload = "auto";

        // Mencegah browser (khususnya Chrome) menghentikan video dengan alasan "video-only background media"
        // Kita harus menempelkannya ke DOM secara fisik tapi membuatnya tidak terlihat.
        videoEl.style.position = "fixed";
        videoEl.style.top = "0";
        videoEl.style.left = "0";
        videoEl.style.width = "1px";
        videoEl.style.height = "1px";
        videoEl.style.opacity = "0.01";
        videoEl.style.pointerEvents = "none";
        videoEl.style.zIndex = "-9999";
        document.body.appendChild(videoEl);

        const objectUrl = URL.createObjectURL(file);
        let recorderStarted = false;

        let safetyTimer: NodeJS.Timeout | null = null;
        let remainingSafetyMs = 60000;
        let lastSafetyStartTime = 0;

        const onVisibilityChange = () => {
            if (document.hidden) {
                // Tab disembunyikan -> pause video dan pause safety timer
                videoEl.pause();
                if (safetyTimer) {
                    clearTimeout(safetyTimer);
                    safetyTimer = null;
                    remainingSafetyMs -= Date.now() - lastSafetyStartTime;
                }
            } else {
                // Tab aktif -> resume video dan jalankan lagi timer
                // Guard: jangan resume jika proses sudah selesai/dibatalkan
                if (recorderStarted && !stopped) {
                    videoEl.play().catch((e) => console.warn("Resume failed", e));
                    lastSafetyStartTime = Date.now();
                    safetyTimer = setTimeout(stopAndFinish, Math.max(1000, remainingSafetyMs));
                }
            }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);

        const cleanup = () => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            if (safetyTimer) clearTimeout(safetyTimer);
            videoEl.onloadedmetadata = null;
            videoEl.onerror = null;
            videoEl.onended = null;
            URL.revokeObjectURL(objectUrl);
            videoEl.src = "";
            videoEl.load();
            if (videoEl.parentNode) {
                videoEl.parentNode.removeChild(videoEl);
            }
        };

        videoEl.onerror = () => {
            cleanup();
            reject(new Error(`Gagal memuat video: ${file.name}`));
        };

        videoEl.onloadedmetadata = () => {
            const d = videoEl.duration;
            if (!isFinite(d) || d === 0) {
                videoEl.addEventListener("seeked", () => startCompress(), { once: true });
                videoEl.currentTime = 1e101;
            } else {
                startCompress();
            }
        };

        videoEl.src = objectUrl;

        let stopped = false;
        let stopAndFinish: () => void;

        function startCompress() {
            const duration = videoEl.duration;
            remainingSafetyMs = (isFinite(duration) && duration > 0 ? duration + 30 : 90) * 1000;

            const rawW = videoEl.videoWidth;
            const rawH = videoEl.videoHeight;

            if (!rawW || !rawH) {
                cleanup();
                reject(new Error(`Dimensi video tidak terbaca: ${file.name}`));
                return;
            }

            let scale = 1;
            if (rawW >= rawH) {
                if (rawW > 1280 || rawH > 720) scale = Math.min(1280 / rawW, 720 / rawH);
            } else {
                if (rawW > 720 || rawH > 1280) scale = Math.min(720 / rawW, 1280 / rawH);
            }

            const canvasW = Math.round(rawW * scale);
            const canvasH = Math.round(rawH * scale);

            const canvas = document.createElement("canvas");
            canvas.width = canvasW;
            canvas.height = canvasH;
            const ctx = canvas.getContext("2d")!;

            const stream: MediaStream =
                (canvas as any).captureStream?.(TARGET_FPS) ??
                (canvas as any).mozCaptureStream?.(TARGET_FPS);

            if (!stream) {
                cleanup();
                reject(new Error("Browser tidak mendukung canvas captureStream"));
                return;
            }

            const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
                ? "video/webm;codecs=vp8,opus"
                : "video/webm";

            const recorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: TARGET_BITRATE,
            });

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            let animId: number;
            const drawFrame = () => {
                ctx.drawImage(videoEl, 0, 0, canvasW, canvasH);
                animId = requestAnimationFrame(drawFrame);
            };

            stopAndFinish = () => {
                if (stopped) return;
                stopped = true;
                videoEl.pause();
                cancelAnimationFrame(animId);
                if (recorderStarted) {
                    recorder.stop();
                } else {
                    if (safetyTimer) clearTimeout(safetyTimer);
                    cleanup();
                    reject(new Error(`Video tidak dapat direkam: ${file.name}`));
                }
            };

            videoEl.onended = stopAndFinish;

            recorder.onstop = () => {
                if (safetyTimer) clearTimeout(safetyTimer);
                cleanup();

                if (chunks.length === 0) {
                    reject(new Error(`Hasil kompresi kosong (0 bytes): ${file.name}`));
                    return;
                }

                const blob = new Blob(chunks, { type: mimeType });
                if (blob.size === 0) {
                    reject(new Error(`Hasil kompresi kosong (0 bytes): ${file.name}`));
                    return;
                }

                const baseName = file.name.replace(/\.[^/.]+$/, "");
                const compressedFile = new File([blob], `${baseName}.webm`, {
                    type: mimeType,
                    lastModified: Date.now(),
                });

                resolve(compressedFile);
            };

            const beginRecording = () => {
                animId = requestAnimationFrame(drawFrame);
                recorder.start(100);
                recorderStarted = true;
                lastSafetyStartTime = Date.now();
                safetyTimer = setTimeout(stopAndFinish, remainingSafetyMs);

                videoEl.play().catch((err) => {
                    // Jika tab di-background, browser akan throw AbortError (atau NotAllowedError).
                    // Kita abaikan — visibilitychange akan resume videonya nanti.
                    if (err.name === "AbortError" || err.name === "NotAllowedError") {
                        console.warn("Video play aborted by browser (likely background tab). Waiting for visibility change.");
                        return;
                    }
                    // Error nyata lainnya: hentikan dan reject, tapi pastikan tidak double-reject.
                    // stopAndFinish() memanggil recorder.stop() → recorder.onstop → resolve().
                    // Untuk menghindari double-call, kita set stopped = true terlebih dahulu
                    // lalu reject secara manual tanpa lewat recorder.onstop.
                    if (!stopped) {
                        stopped = true;
                        videoEl.pause();
                        cancelAnimationFrame(animId);
                        if (safetyTimer) clearTimeout(safetyTimer);
                        cleanup();
                        reject(new Error(`Gagal memutar video untuk kompresi: ${err.message}`));
                    }
                });
            };

            if (videoEl.currentTime === 0) {
                setTimeout(beginRecording, 0);
            } else {
                videoEl.addEventListener("seeked", beginRecording, { once: true });
                videoEl.currentTime = 0;
            }
        }
    });
}
