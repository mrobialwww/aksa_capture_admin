import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HurufCardProps {
    letter: string;
    gerakanTab: "benar" | "salah";
}

// Menjadi Server Component karena state dikelola secara global di MateriTabs
export function HurufCard({ letter, gerakanTab }: HurufCardProps) {
    const isBenar = gerakanTab === "benar";

    return (
        <Link
            href={`/materi/huruf/${encodeURIComponent(letter)}?is_correct=${isBenar}`}
            className="block rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <Card className="flex min-h-[160px] flex-col justify-between gap-0 rounded-[20px] p-0 shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md">
                <div className="flex flex-col items-start px-5 pt-5 pb-2">
                    <span className="text-3xl font-bold leading-none text-foreground">
                        {letter}
                    </span>
                </div>

                <div className="mt-auto flex justify-center pb-5">
                    <Badge
                        variant="outline"
                        className={cn(
                            "gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold shadow-none",
                            isBenar
                                ? "border-emerald-200/60 bg-emerald-50/50 text-emerald-600"
                                : "border-red-200/60 bg-red-50/50 text-red-600",
                        )}
                    >
                        {isBenar ? (
                            <CheckCircle
                                className="size-3.5"
                                strokeWidth={2.5}
                            />
                        ) : (
                            <XCircle className="size-3.5" strokeWidth={2.5} />
                        )}
                        {isBenar ? "Gerakan Benar" : "Gerakan Salah"}
                    </Badge>
                </div>
            </Card>
        </Link>
    );
}
