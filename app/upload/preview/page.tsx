import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UploadProgress } from "../_components/upload-progress";

export const metadata = {
    title: "Preview & Upload | Aksa Capture",
    description: "Preview dan unggah video",
};

interface PageProps {
    searchParams: Promise<{
        type?: string;
        label?: string;
        is_correct?: string;
        error_category?: string;
        capture_location?: string;
        duration_sec?: string;
    }>;
}

export default async function PreviewPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const type = sp.type || "huruf";
    const label = sp.label || "";
    const isCorrect = sp.is_correct === "true";
    const errorCategory = sp.error_category;
    const captureLocation = sp.capture_location || "indoor";
    // duration_sec is set when video came through the editor (trim/rotate).
    // For gallery/camera videos that skipped editing, this will be undefined
    // and UploadProgress falls back to reading it from the video element.
    const durationSec = sp.duration_sec
        ? parseFloat(sp.duration_sec)
        : undefined;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
                <Link
                    href={`/upload/source?type=${type}&label=${label}&is_correct=${sp.is_correct}`}
                    className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="size-4" />
                    Pilih Ulang Video
                </Link>

                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#001D4A]">
                        Preview & Upload
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pastikan video sudah sesuai sebelum diunggah ke server.
                    </p>
                </div>

                <UploadProgress
                    type={type}
                    label={label}
                    isCorrect={isCorrect}
                    errorCategory={errorCategory}
                    captureLocation={captureLocation}
                    durationSec={durationSec}
                />
            </div>
        </div>
    );
}
