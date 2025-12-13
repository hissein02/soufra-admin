
'use client'

import Link from 'next/link'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/login/actions'
import { usePathname } from 'next/navigation'

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-screen w-64 flex-col bg-[#1F4E5F] text-white">
            <div className="flex h-16 items-center border-b border-[#163C4A] px-6">
                <h1 className="text-xl font-bold tracking-tight">Soufra Admin</h1>
            </div>
            <nav className="flex-1 space-y-1 px-4 py-4">
                <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[#163C4A] ${pathname === '/dashboard' ? 'bg-[#163C4A]' : ''
                        }`}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Restaurants
                </Link>
                {/* Add more links here as needed */}
            </nav>
            <div className="border-t border-[#163C4A] p-4">
                <form action={signOut}>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 hover:bg-[#163C4A] hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </form>
            </div>
        </div>
    )
}
