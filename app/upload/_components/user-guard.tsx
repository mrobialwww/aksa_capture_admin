"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/useUserStore";

export function UserGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { name, gender } = useUserStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (!name || !gender) {
            router.replace("/setup");
        }
    }, [name, gender, router]);

    // Prevent hydration mismatch
    if (!isMounted) return null;

    // If mounted but missing data, we are currently redirecting, so hide content
    // to prevent flickering of the protected page
    if (!name || !gender) return null;

    return <>{children}</>;
}
