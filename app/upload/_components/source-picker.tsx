"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Image as ImageIcon, Loader2, Images } from "lucide-react";
import { toast } from "sonner";
import { CameraRecorder } from "./camera-recorder";
import { setPendingVideo } from "@/lib/pending-video-store";

export function SourcePicker() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showRecorder, setShowRecorder] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        await processAndNavigate(file);
    };

    const handleBatchNavigate = () => {
        router.push(`/upload/batch?${searchParams.toString()}`);
    };

    const handleRecordComplete = async (file: File) => {
        setShowRecorder(false);
        await processAndNavigate(file);
    };

    const processAndNavigate = async (file: File) => {
        setIsProcessing(true);

        // Validasi file (max 5 menit / 100MB dsb. bisa ditambahkan)
        if (file.size > 100 * 1024 * 1024) {
            toast.error("Ukuran video terlalu besar. Maksimal 100MB.");
            setIsProcessing(false);
            return;
        }

        try {
            // Store the raw blob in module-level store (strong reference prevents GC on mobile)
            // and also mirror the blob URL to sessionStorage for metadata access.
            const objectUrl = setPendingVideo(file, file.name, file.type);
            void objectUrl; // URL is already stored in sessionStorage by setPendingVideo

            router.push(`/upload/edit?${searchParams.toString()}`);
        } catch (err) {
            toast.error("Gagal memproses video");
            setIsProcessing(false);
        }
    };

    if (showRecorder) {
        return (
            <CameraRecorder
                onComplete={handleRecordComplete}
                onCancel={() => setShowRecorder(false)}
            />
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <input
                type="file"
                accept="video/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
            />

            <button
                onClick={() => setShowRecorder(true)}
                disabled={isProcessing}
                className="group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-primary bg-primary/5 p-8 text-primary transition-all hover:bg-primary/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/20 transition-transform group-hover:scale-110">
                    <Camera className="size-7" />
                </div>
                <div className="space-y-1 text-center">
                    <h3 className="font-bold text-lg">Rekam Kamera</h3>
                    <p className="text-sm opacity-80">
                        Rekam langsung dengan kamera perangkat (Maks 5 menit)
                    </p>
                </div>
                {isProcessing && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="size-8 animate-spin text-primary" />
                    </div>
                )}
            </button>

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-border/60 bg-white p-8 text-foreground transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
                <div className="flex size-14 items-center justify-center rounded-full bg-muted transition-transform group-hover:scale-110">
                    <ImageIcon className="size-7 text-muted-foreground" />
                </div>
                <div className="space-y-1 text-center">
                    <h3 className="font-bold text-lg">Pilih dari Galeri</h3>
                    <p className="text-sm text-muted-foreground">
                        Pilih file video dari penyimpanan perangkat
                    </p>
                </div>
                {isProcessing && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="size-8 animate-spin text-primary" />
                    </div>
                )}
            </button>

            {/* Batch upload — gallery only */}
            <button
                onClick={handleBatchNavigate}
                disabled={isProcessing}
                className="group flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 p-5 text-emerald-700 transition-all hover:border-emerald-400 hover:bg-emerald-50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 transition-transform group-hover:scale-110">
                    <Images className="size-5" />
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-sm">Upload Banyak dari Galeri</h3>
                    <p className="text-xs text-emerald-600 mt-0.5">
                        Upload hingga 20 video sekaligus untuk kategori ini
                    </p>
                </div>
            </button>
        </div>
    );
}
