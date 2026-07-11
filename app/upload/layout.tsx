import { Video } from "lucide-react";
import Link from "next/link";
import { UserGuard } from "./_components/user-guard";
import { UserMenu } from "./_components/user-menu";

export default function UploadLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="flex h-14 w-full items-center justify-between px-6 md:px-12 lg:px-24">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                    >
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <Video className="size-4" />
                        </div>
                        <span className="text-base font-bold text-foreground">
                            Aksa Capture
                        </span>
                    </Link>

                    <UserMenu />
                </div>
            </header>

            <main className="flex-1 w-full px-6 md:px-12 lg:px-24 py-8">
                <UserGuard>{children}</UserGuard>
            </main>
        </div>
    );
}
