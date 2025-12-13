
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"

export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-4 text-center dark:bg-zinc-950">
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    <ShieldAlert className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-[#1F4E5F]">
                        Access Denied
                    </h1>
                    <p className="text-muted-foreground max-w-[350px] mx-auto text-balance">
                        You do not have permission to access the admin dashboard. This area is restricted to super administrators only.
                    </p>
                </div>
                <div className="flex justify-center">
                    <Button asChild className="bg-[#E05D34] hover:bg-[#c94e2a] text-white">
                        <Link href="/login">
                            Return to Login
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
