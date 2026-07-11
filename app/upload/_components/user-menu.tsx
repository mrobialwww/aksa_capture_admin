"use client";

import { useUserStore } from "@/lib/store/useUserStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
    const { name, gender, clearUser } = useUserStore();
    const router = useRouter();

    if (!name || !gender) return null;

    const handleClear = () => {
        clearUser();
        router.replace("/setup");
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-9 gap-2 rounded-full border border-border bg-background px-3 hover:bg-accent hover:text-accent-foreground"
                >
                    <User className="size-4" />
                    <span className="text-sm font-medium hidden sm:inline-block max-w-[120px] truncate">
                        {name}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">
                            {name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground capitalize">
                            {gender === "male" || gender === "laki-laki"
                                ? "Laki-laki"
                                : "Perempuan"}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleClear}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                    <LogOut className="mr-2 size-4" />
                    <span>Hapus Data Diri</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
