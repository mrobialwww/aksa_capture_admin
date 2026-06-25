"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GalleryHurufCard } from "./gallery-huruf-card";
import { GalleryKataCard } from "./gallery-kata-card";
import { HURUF_LIST, KATA_LIST, GROUPED_KATA_LIST, DESKTOP_KATA_ROWS } from "@/lib/constants";

export function GalleryTabs() {
    const [tab, setTab] = useState<string>("huruf");
    const [gerakanTab, setGerakanTab] = useState<"benar" | "salah">("benar");

    // Load state dari localStorage saat pertama kali mount
    useEffect(() => {
        const savedTab = localStorage.getItem("gallery-active-tab");
        if (savedTab === "huruf" || savedTab === "kata") setTab(savedTab);

        const savedGerakan = localStorage.getItem("gallery-gerakan-tab");
        if (savedGerakan === "benar" || savedGerakan === "salah")
            setGerakanTab(savedGerakan);
    }, []);

    const handleTabChange = (val: string) => {
        setTab(val);
        localStorage.setItem("gallery-active-tab", val);
    };

    const handleGerakanChange = (val: "benar" | "salah") => {
        setGerakanTab(val);
        localStorage.setItem("gallery-gerakan-tab", val);
    };

    return (
        <Tabs
            value={tab}
            onValueChange={handleTabChange}
            className="flex flex-col gap-8"
        >
            {/* Top Controls */}
            <div className="flex flex-col gap-6">
                <TabsList className="w-fit rounded-xl bg-muted/50 p-1">
                    <TabsTrigger
                        id="tab-huruf"
                        value="huruf"
                        className="rounded-lg px-8 py-1.5 font-semibold"
                    >
                        Huruf
                    </TabsTrigger>
                    <TabsTrigger
                        id="tab-kata"
                        value="kata"
                        className="rounded-lg px-8 py-1.5 font-semibold"
                    >
                        Kata
                    </TabsTrigger>
                </TabsList>

                {/* Gerakan Benar / Gerakan Salah — global filter */}
                <div className="flex items-center gap-3">
                    <Button
                        id="gerakan-benar-global"
                        variant="outline"
                        size="sm"
                        onClick={() => handleGerakanChange("benar")}
                        className={cn(
                            "gap-2 rounded-full px-4 py-4 text-xs font-bold transition-all shadow-none",
                            gerakanTab === "benar"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                : "text-muted-foreground/70 border-border/60 bg-transparent hover:bg-muted/50",
                        )}
                    >
                        <CheckCircle className="size-4" strokeWidth={2.5} />
                        Gerakan Benar
                    </Button>
                    <Button
                        id="gerakan-salah-global"
                        variant="outline"
                        size="sm"
                        onClick={() => handleGerakanChange("salah")}
                        className={cn(
                            "gap-2 rounded-full px-4 py-4 text-xs font-bold transition-all shadow-none",
                            gerakanTab === "salah"
                                ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                : "text-muted-foreground/70 border-border/60 bg-transparent hover:bg-muted/50",
                        )}
                    >
                        <XCircle className="size-4" strokeWidth={2.5} />
                        Gerakan Salah
                    </Button>
                </div>
            </div>

            {/* ── Huruf Content ── */}
            <TabsContent value="huruf" className="mt-0 outline-none">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {HURUF_LIST.map((letter) => (
                        <GalleryHurufCard
                            key={letter}
                            letter={letter}
                            gerakanTab={gerakanTab}
                        />
                    ))}
                </div>
            </TabsContent>

            {/* ── Kata Content ── */}
            <TabsContent value="kata" className="mt-0 outline-none">
                {/* Mobile View */}
                <div className="flex flex-col gap-8 xl:hidden">
                    {GROUPED_KATA_LIST.map((group, groupIdx) => (
                        <div key={groupIdx} className="flex flex-col gap-8">
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {group.map((word) => {
                                    const index = KATA_LIST.indexOf(word);
                                    return (
                                        <GalleryKataCard
                                            key={word}
                                            index={index}
                                            word={word}
                                            gerakanTab={gerakanTab}
                                        />
                                    );
                                })}
                            </div>
                            {groupIdx < GROUPED_KATA_LIST.length - 1 && (
                                <hr className="border-t-2 border-emerald-500/60" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Desktop View */}
                <div className="hidden xl:flex flex-col gap-8">
                    {DESKTOP_KATA_ROWS.map((row, rowIdx) => {
                        const totalItemsInRow = row.reduce((sum, g) => sum + g.length, 0);
                        const remainingCols = 6 - totalItemsInRow;
                        
                        return (
                            <div key={rowIdx} className="flex flex-col gap-8">
                                <div className="flex flex-row gap-4 w-full">
                                    {row.map((group, groupIdx) => (
                                        <div key={groupIdx} className="flex flex-row gap-4" style={{ flex: group.length }}>
                                            <div 
                                                className="grid gap-4 w-full"
                                                style={{ gridTemplateColumns: `repeat(${group.length}, minmax(0, 1fr))` }}
                                            >
                                                {group.map((word) => {
                                                    const index = KATA_LIST.indexOf(word);
                                                    return (
                                                        <GalleryKataCard
                                                            key={word}
                                                            index={index}
                                                            word={word}
                                                            gerakanTab={gerakanTab}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            {groupIdx < row.length - 1 && (
                                                <div className="w-[3px] bg-emerald-500/60 rounded-full shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                    {remainingCols > 0 && (
                                        <div style={{ flex: remainingCols }} />
                                    )}
                                </div>
                                {rowIdx < DESKTOP_KATA_ROWS.length - 1 && (
                                    <hr className="border-t-2 border-emerald-500/60" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </TabsContent>
        </Tabs>
    );
}
