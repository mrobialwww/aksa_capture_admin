import Link from "next/link";
import { ArrowLeft, Shapes, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BatchUploader } from "./_components/batch-uploader";

export const metadata = {
    title: "Upload Banyak Video | Aksa Capture",
    description: "Upload hingga 20 video sekaligus untuk satu kategori",
};

interface PageProps {
    searchParams: Promise<{
        type?: string;
        label?: string;
        is_correct?: string;
        error_category?: string;
        capture_location?: string;
    }>;
}

export default async function BatchUploadPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const type = sp.type || "huruf";
    const label = sp.label || "";
    const isCorrect = sp.is_correct === "true";
    const errorCategory = sp.error_category;
    const captureLocation = sp.capture_location || "indoor";

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
                <Link
                    href={`/upload/source?type=${type}&label=${label}&is_correct=${sp.is_correct}&capture_location=${captureLocation}${errorCategory ? `&error_category=${errorCategory}` : ""}`}
                    className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="size-4" />
                    Kembali
                </Link>

                {/* Ringkasan Kategori */}
                <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm border border-border/50">
                    <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                        Kategori Upload
                    </h2>
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-black text-[#001D4A] uppercase">
                            {label}
                        </span>
                        <div className="flex flex-col gap-2 items-end">
                            <Badge
                                variant="secondary"
                                className="bg-[#E6F0FF] text-[#0A56D9] border-transparent font-bold"
                            >
                                <Shapes className="size-3.5 mr-1.5" />
                                {type === "huruf" ? "Huruf" : "Kata"}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={
                                    isCorrect
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                }
                            >
                                {isCorrect ? (
                                    <CheckCircle className="size-3.5 mr-1.5" />
                                ) : (
                                    <XCircle className="size-3.5 mr-1.5" />
                                )}
                                {isCorrect ? "Gerakan Benar" : "Gerakan Salah"}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="bg-white text-muted-foreground border-border font-bold capitalize"
                            >
                                {captureLocation}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#001D4A]">
                        Upload Banyak Video
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pilih hingga 20 video dari galeri perangkat Anda. Semua
                        video akan diupload untuk kategori{" "}
                        <strong>{label}</strong>.
                    </p>
                </div>

                <BatchUploader
                    type={type}
                    label={label}
                    isCorrect={isCorrect}
                    errorCategory={errorCategory}
                    captureLocation={captureLocation}
                />
            </div>
        </div>
    );
}
