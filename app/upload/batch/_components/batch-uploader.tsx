"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Upload,
    X,
    FileVideo,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Images,
    CloudUpload,
    RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/store/useUserStore";
import {
    getBatchUploadUrls,
    uploadVideoToCloud,
    createBatchVideoMetadata,
    BatchUploadUrlItem,
} from "@/lib/api";

const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 10;
const MAX_CONCURRENT_UPLOADS = 3;

interface BatchItem {
    id: string;
    file: File;
    status: "pending" | "uploading" | "success" | "error";
    errorMsg?: string;
    uploadData?: BatchUploadUrlItem;
}

interface BatchUploaderProps {
    type: string;
    label: string;
    isCorrect: boolean;
    errorCategory?: string;
    captureLocation: string;
}

type UploadPhase = "select" | "uploading" | "done";

export function BatchUploader({
    type,
    label,
    isCorrect,
    errorCategory,
    captureLocation,
}: BatchUploaderProps) {
    const router = useRouter();
    const { name, gender } = useUserStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [items, setItems] = useState<BatchItem[]>([]);
    const [phase, setPhase] = useState<UploadPhase>("select");
    const [isDragging, setIsDragging] = useState(false);

    // ──────────────────────────────────────────────
    // File selection helpers
    // ──────────────────────────────────────────────

    const addFiles = useCallback((newFiles: File[]) => {
        const valid: File[] = [];
        const skipped: string[] = [];

        for (const file of newFiles) {
            if (!file.type.startsWith("video/")) {
                skipped.push(`${file.name} (bukan video)`);
                continue;
            }
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                skipped.push(`${file.name} (>100MB)`);
                continue;
            }
            valid.push(file);
        }

        setItems((prev) => {
            const combined = [
                ...prev,
                ...valid.map((f) => ({
                    id: `${f.name}-${f.lastModified}-${Math.random()}`,
                    file: f,
                    status: "pending" as const,
                })),
            ];

            const limited = combined.slice(0, MAX_FILES);
            const overflow = combined.length - MAX_FILES;
            if (overflow > 0) {
                toast.warning(
                    `${overflow} file diabaikan karena melebihi batas ${MAX_FILES} video.`,
                );
            }
            return limited;
        });

        if (skipped.length > 0) {
            toast.error(
                `${skipped.length} file dilewati: ${skipped.slice(0, 3).join(", ")}${skipped.length > 3 ? "..." : ""}`,
            );
        }
    }, []);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        addFiles(files);
        // Reset input so same file can be re-added after removal
        e.target.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    // ──────────────────────────────────────────────
    // Upload logic
    // ──────────────────────────────────────────────

    const handleUploadAll = async () => {
        if (items.length === 0) return;
        if (!name || !gender) {
            toast.error("Data diri belum lengkap.");
            router.push("/setup");
            return;
        }

        setPhase("uploading");

        const backendType = type.toLowerCase() === "huruf" ? "letter" : "word";

        // 1. Get presigned URLs for all items
        let uploadUrls: BatchUploadUrlItem[];
        try {
            const payload = items.map(() => ({ type: backendType, label }));
            const res = await getBatchUploadUrls(payload);
            uploadUrls = res.data;
        } catch (err) {
            toast.error("Gagal mendapatkan URL upload. Periksa koneksi.");
            setPhase("select");
            return;
        }

        // Attach upload data to each item
        setItems((prev) =>
            prev.map((item, i) => ({ ...item, uploadData: uploadUrls[i] })),
        );

        // Snapshot items BEFORE async ops (closure safety)
        const localItems = [...items];

        // Track successful uploads via local Set (not React state which is stale in closure)
        const successIds = new Set<string>();

        // 2. Upload files to R2 with concurrency limit
        const uploadFile = async (
            item: BatchItem,
            urlData: BatchUploadUrlItem,
        ) => {
            setItems((prev) =>
                prev.map((it) =>
                    it.id === item.id ? { ...it, status: "uploading" } : it,
                ),
            );
            try {
                await uploadVideoToCloud(
                    urlData.upload_url,
                    item.file,
                    item.file.type,
                );
                successIds.add(item.id); // track locally
                setItems((prev) =>
                    prev.map((it) =>
                        it.id === item.id ? { ...it, status: "success" } : it,
                    ),
                );
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Gagal upload";
                setItems((prev) =>
                    prev.map((it) =>
                        it.id === item.id
                            ? { ...it, status: "error", errorMsg: msg }
                            : it,
                    ),
                );
            }
        };

        // Concurrency-limited runner — proper worker pool pattern
        // Each worker picks the next task by pre-incrementing the shared index
        // BEFORE any await, ensuring no two workers get the same task.
        const queue = localItems.map(
            (item, i) => () => uploadFile(item, uploadUrls[i]),
        );

        let nextIdx = 0;
        const worker = async (): Promise<void> => {
            while (nextIdx < queue.length) {
                const idx = nextIdx++; // atomically grab next index before any await
                await queue[idx]();
            }
        };

        const workerCount = Math.min(MAX_CONCURRENT_UPLOADS, queue.length);
        await Promise.all(Array.from({ length: workerCount }, worker));


        // 3. Save metadata — use local successIds (NOT stale React state)
        const successItems = localItems
            .map((item, i) => ({ item, urlData: uploadUrls[i] }))
            .filter(({ item }) => successIds.has(item.id));

        if (successItems.length > 0) {
            try {
                await createBatchVideoMetadata(
                    successItems.map(({ item, urlData }) => ({
                        sample_id: urlData.sample_id,
                        video_path: urlData.video_path,
                        video_url: urlData.video_url,
                        name,
                        gender,
                        gesture_type: backendType,
                        gesture_name: label,
                        is_correct: isCorrect,
                        error_category:
                            !isCorrect && errorCategory
                                ? errorCategory
                                : undefined,
                        capture_location: captureLocation,
                    })),
                );
            } catch (err) {
                toast.error(
                    "Video berhasil diupload ke storage, namun gagal menyimpan metadata.",
                );
            }
        }

        setPhase("done");
    };

    // ──────────────────────────────────────────────
    // Derived stats
    // ──────────────────────────────────────────────

    const successCount = items.filter((i) => i.status === "success").length;
    const errorCount = items.filter((i) => i.status === "error").length;
    const uploadingCount = items.filter((i) => i.status === "uploading").length;
    const pendingCount = items.filter((i) => i.status === "pending").length;

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // ──────────────────────────────────────────────
    // Render: Done state
    // ──────────────────────────────────────────────

    if (phase === "done") {
        return (
            <div className="flex flex-col items-center gap-6 py-10">
                <div
                    className={cn(
                        "flex size-20 items-center justify-center rounded-full",
                        errorCount === 0 ? "bg-emerald-100" : "bg-amber-100",
                    )}
                >
                    {errorCount === 0 ? (
                        <CheckCircle2 className="size-10 text-emerald-600" />
                    ) : (
                        <AlertCircle className="size-10 text-amber-600" />
                    )}
                </div>

                <div className="text-center">
                    <h2 className="text-xl font-extrabold text-[#001D4A]">
                        {errorCount === 0
                            ? "Upload Selesai!"
                            : "Upload Sebagian Berhasil"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {successCount} berhasil
                        {errorCount > 0 ? `, ${errorCount} gagal` : ""}
                    </p>
                </div>

                {/* Item summary */}
                <div className="w-full flex flex-col gap-2">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm",
                                item.status === "success" &&
                                    "bg-emerald-50 text-emerald-800",
                                item.status === "error" &&
                                    "bg-red-50 text-red-800",
                            )}
                        >
                            {item.status === "success" ? (
                                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                            ) : (
                                <AlertCircle className="size-4 shrink-0 text-red-500" />
                            )}
                            <span className="flex-1 truncate font-medium">
                                {item.file.name}
                            </span>
                            {item.status === "error" && (
                                <span className="text-xs text-red-600 shrink-0">
                                    {item.errorMsg}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 w-full">
                    {successCount < MAX_FILES && (
                        <Button
                            onClick={() => {
                                setItems([]);
                                setPhase("select");
                            }}
                            variant="outline"
                            className="flex-1 rounded-xl h-11 gap-2"
                        >
                            <RotateCcw className="size-4" />
                            Upload Lagi
                        </Button>
                    )}
                    <Button
                        onClick={() => router.push("/upload")}
                        className="flex-1 rounded-xl h-11 bg-[#0A56D9] hover:bg-[#0848B8] text-white font-bold gap-2"
                    >
                        Selesai
                    </Button>
                </div>
            </div>
        );
    }

    // ──────────────────────────────────────────────
    // Render: Select / Uploading state
    // ──────────────────────────────────────────────

    const isUploading = phase === "uploading";

    return (
        <div className="flex flex-col gap-5">
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
                disabled={isUploading}
            />

            {/* Drop zone (only when no files selected yet) */}
            {items.length === 0 && (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all",
                        isDragging
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/50",
                    )}
                >
                    <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
                        <Images className="size-8 text-emerald-600" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-[#001D4A]">
                            Klik atau seret file video ke sini
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Pilih hingga {MAX_FILES} video • Maks{" "}
                            {MAX_FILE_SIZE_MB}MB per file
                        </p>
                    </div>
                </div>
            )}

            {/* File list */}
            {items.length > 0 && (
                <div className="flex flex-col gap-2">
                    {/* Header row */}
                    <div className="flex items-center justify-between px-1">
                        <span className="text-sm font-bold text-muted-foreground">
                            {items.length} video dipilih
                            {items.length < MAX_FILES && (
                                <span className="text-xs font-normal ml-1">
                                    (maks {MAX_FILES})
                                </span>
                            )}
                        </span>
                        {!isUploading && items.length < MAX_FILES && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs font-semibold text-primary hover:underline"
                            >
                                + Tambah lagi
                            </button>
                        )}
                    </div>

                    {/* Items */}
                    <div className="flex flex-col gap-2">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                                    item.status === "pending" &&
                                        "bg-white border-border/50",
                                    item.status === "uploading" &&
                                        "bg-blue-50 border-blue-200",
                                    item.status === "success" &&
                                        "bg-emerald-50 border-emerald-200",
                                    item.status === "error" &&
                                        "bg-red-50 border-red-200",
                                )}
                            >
                                {/* Icon */}
                                <div
                                    className={cn(
                                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                                        item.status === "pending" &&
                                            "bg-slate-100",
                                        item.status === "uploading" &&
                                            "bg-blue-100",
                                        item.status === "success" &&
                                            "bg-emerald-100",
                                        item.status === "error" && "bg-red-100",
                                    )}
                                >
                                    {item.status === "pending" && (
                                        <FileVideo className="size-4 text-slate-500" />
                                    )}
                                    {item.status === "uploading" && (
                                        <Loader2 className="size-4 text-blue-600 animate-spin" />
                                    )}
                                    {item.status === "success" && (
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                    )}
                                    {item.status === "error" && (
                                        <AlertCircle className="size-4 text-red-500" />
                                    )}
                                </div>

                                {/* File info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate text-[#001D4A]">
                                        {item.file.name}
                                    </p>
                                    <p
                                        className={cn(
                                            "text-xs mt-0.5",
                                            item.status === "error"
                                                ? "text-red-600"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        {item.status === "error"
                                            ? item.errorMsg
                                            : item.status === "uploading"
                                              ? "Mengupload..."
                                              : item.status === "success"
                                                ? "Berhasil"
                                                : formatSize(item.file.size)}
                                    </p>
                                </div>

                                {/* Remove button (only when not uploading) */}
                                {!isUploading && (
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="shrink-0 flex size-7 items-center justify-center rounded-full hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Progress bar during upload */}
            {isUploading && (
                <div className="rounded-xl bg-white border border-border/50 p-4 flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>
                            {uploadingCount > 0
                                ? `Mengupload ${uploadingCount} file...`
                                : "Memproses..."}
                        </span>
                        <span>
                            {successCount + errorCount} / {items.length}
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[#0A56D9] transition-all duration-300"
                            style={{
                                width: `${((successCount + errorCount) / items.length) * 100}%`,
                            }}
                        />
                    </div>
                    {pendingCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {pendingCount} video menunggu...
                        </p>
                    )}
                </div>
            )}

            {/* Upload button */}
            {items.length > 0 && !isUploading && (
                <Button
                    onClick={handleUploadAll}
                    className="w-full rounded-xl h-12 bg-[#0A56D9] hover:bg-[#0848B8] text-white font-bold shadow-md shadow-blue-500/20 gap-2 text-base"
                >
                    <CloudUpload className="size-5" />
                    Upload {items.length} Video Sekaligus
                </Button>
            )}

            {/* Upload in progress — disable actions */}
            {isUploading && (
                <Button
                    disabled
                    className="w-full rounded-xl h-12 font-bold text-base gap-2"
                >
                    <Loader2 className="size-5 animate-spin" />
                    Mengupload {successCount + errorCount} / {items.length}...
                </Button>
            )}
        </div>
    );
}
