"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, ArrowRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { HURUF_LIST, KATA_LIST, GROUPED_KATA_LIST } from "@/lib/constants";

export function CategorySelector() {
    const router = useRouter();
    const [type, setType] = useState<"huruf" | "kata">("huruf");
    const [label, setLabel] = useState<string>("");
    const [isCorrect, setIsCorrect] = useState<boolean>(true);
    const [errorCategory, setErrorCategory] = useState<string>("");
    const [captureLocation, setCaptureLocation] = useState<
        "indoor" | "outdoor"
    >("indoor");

    const handleNext = () => {
        if (!label) return;

        if (!isCorrect && !errorCategory) {
            toast.error("Pilih kategori kesalahan terlebih dahulu");
            return;
        }

        // Save to url params and navigate
        const params = new URLSearchParams();
        params.set("type", type);
        params.set("label", label);
        params.set("is_correct", String(isCorrect));
        params.set("capture_location", captureLocation);
        if (!isCorrect && errorCategory) {
            params.set("error_category", errorCategory);
        }

        router.push(`/upload/source?${params.toString()}`);
    };

    return (
        <div className="flex flex-col gap-8 pb-12">
            {/* Header & Button */}
            <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#001D4A]">
                        Pilih Kategori
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Tentukan jenis dan status gerakan yang akan Anda rekam.
                    </p>
                </div>

                {label && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <Button
                            onClick={handleNext}
                            className="px-6 rounded-xl h-12 bg-[#0A56D9] text-white font-bold text-sm hover:bg-[#0848B8] shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
                        >
                            Lanjut ke Rekam Video
                            <ArrowRight className="ml-2 size-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-8">
                {/* 1. Pilih Jenis Gerakan */}
                <div className="flex flex-col gap-4">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        1. Pilih Jenis Gerakan
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => {
                                setIsCorrect(true);
                                setErrorCategory("");
                            }}
                            className={cn(
                                "flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-all border shadow-sm",
                                isCorrect
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-300 ring-4 ring-emerald-500/10"
                                    : "bg-white text-muted-foreground/70 border-border/80 hover:bg-slate-50 hover:text-foreground",
                            )}
                        >
                            <CheckCircle className="size-5" strokeWidth={2.5} />
                            Gerakan Benar
                        </button>
                        <button
                            onClick={() => setIsCorrect(false)}
                            className={cn(
                                "flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-all border shadow-sm",
                                !isCorrect
                                    ? "bg-red-50 text-red-600 border-red-300 ring-4 ring-red-500/10"
                                    : "bg-white text-muted-foreground/70 border-border/80 hover:bg-slate-50 hover:text-foreground",
                            )}
                        >
                            <XCircle className="size-5" strokeWidth={2.5} />
                            Gerakan Salah
                        </button>
                    </div>

                    {!isCorrect && (
                        <div className="m-2  animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-bold text-[#001D4A] block mb-2">
                                Kategori Kesalahan
                            </label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full sm:w-1/2 justify-between h-12 rounded-xl border-border/80 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20",
                                            !errorCategory &&
                                                "text-muted-foreground",
                                        )}
                                    >
                                        {errorCategory
                                            ? errorCategory
                                                  .split("_")
                                                  .map(
                                                      (w) =>
                                                          w
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                          w.slice(1),
                                                  )
                                                  .join(" ")
                                            : "Pilih Kategori Kesalahan"}
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px] rounded-xl">
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setErrorCategory("handshape_wrong")
                                        }
                                    >
                                        Handshape Wrong
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setErrorCategory(
                                                "orientation_wrong",
                                            )
                                        }
                                    >
                                        Orientation Wrong
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setErrorCategory("location_wrong")
                                        }
                                    >
                                        Location Wrong
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setErrorCategory("movement_wrong")
                                        }
                                    >
                                        Movement Wrong
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setErrorCategory(
                                                "non_manual_marker_missing",
                                            )
                                        }
                                    >
                                        Non-Manual Marker Missing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setErrorCategory(
                                                "finger_spelling_incomplete",
                                            )
                                        }
                                    >
                                        Finger Spelling Incomplete
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setErrorCategory(
                                                "mixed_with_other_sign",
                                            )
                                        }
                                    >
                                        Mixed with Other Sign
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setErrorCategory("unclear")
                                        }
                                    >
                                        Unclear
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                {/* 2. Pilih Lokasi Pengambilan */}
                <div className="flex flex-col gap-4">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        2. Pilih Lokasi Pengambilan
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setCaptureLocation("indoor")}
                            className={cn(
                                "flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-all border shadow-sm",
                                captureLocation === "indoor"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-300 ring-4 ring-emerald-500/10"
                                    : "bg-white text-muted-foreground/70 border-border/80 hover:bg-slate-50 hover:text-foreground",
                            )}
                        >
                            Indoor
                        </button>
                        <button
                            onClick={() => setCaptureLocation("outdoor")}
                            className={cn(
                                "flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-all border shadow-sm",
                                captureLocation === "outdoor"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-300 ring-4 ring-emerald-500/10"
                                    : "bg-white text-muted-foreground/70 border-border/80 hover:bg-slate-50 hover:text-foreground",
                            )}
                        >
                            Outdoor
                        </button>
                    </div>
                </div>

                {/* 3. Pilih Huruf / Kata */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            3. Pilih {type === "huruf" ? "Huruf" : "Kata"}
                        </span>
                    </div>

                    <Tabs
                        value={type}
                        onValueChange={(v) => {
                            setType(v as any);
                            setLabel("");
                        }}
                    >
                        <TabsList className="w-fit bg-white px-2 py-6 mb-6 rounded-xl border border-border/60 shadow-sm">
                            <TabsTrigger
                                value="huruf"
                                className="rounded-lg px-8 py-4 font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                            >
                                Huruf
                            </TabsTrigger>
                            <TabsTrigger
                                value="kata"
                                className="rounded-lg px-8 py-4 font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                            >
                                Kata
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="huruf"
                            className="mt-0 outline-none"
                        >
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {HURUF_LIST.map((h) => (
                                    <button
                                        key={h}
                                        onClick={() => setLabel(h)}
                                        className={cn(
                                            "flex h-16 items-center justify-center rounded-2xl border-2 text-2xl font-black transition-all shadow-sm",
                                            label === h
                                                ? "border-[#0A56D9] bg-[#0A56D9]/10 text-[#0A56D9] ring-4 ring-[#0A56D9]/10"
                                                : "border-border/60 bg-white text-foreground hover:border-[#0A56D9]/40 hover:bg-[#0A56D9]/5",
                                        )}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="kata" className="mt-0 outline-none">
                            <div className="flex flex-col gap-6">
                                {GROUPED_KATA_LIST.map((group, groupIdx) => (
                                    <div key={groupIdx} className="flex flex-col gap-6">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                            {group.map((k) => (
                                                <button
                                                    key={k}
                                                    onClick={() => setLabel(k)}
                                                    className={cn(
                                                        "flex min-h-16 items-center px-5 rounded-2xl border-2 text-base font-bold capitalize transition-all shadow-sm",
                                                        label === k
                                                            ? "border-[#0A56D9] bg-[#0A56D9]/10 text-[#0A56D9] ring-4 ring-[#0A56D9]/10"
                                                            : "border-border/60 bg-white text-foreground hover:border-[#0A56D9]/40 hover:bg-[#0A56D9]/5",
                                                    )}
                                                >
                                                    {k}
                                                </button>
                                            ))}
                                        </div>
                                        {groupIdx < GROUPED_KATA_LIST.length - 1 && (
                                            <hr className="border-t-2 border-border/60" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
