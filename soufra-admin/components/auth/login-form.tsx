'use client'

import { useState } from 'react'
import { Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, signup } from '@/app/login/actions'

export function LoginForm({ error }: { error?: string }) {
    const [isSignUp, setIsSignUp] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    return (
        <div className="mx-auto w-full max-w-[350px] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center space-y-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E05D34] text-white shadow-lg shadow-[#E05D34]/20">
                    <Utensils className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#1F4E5F]">
                    {isSignUp ? 'Create an account' : 'Welcome back'}
                </h1>
                <p className="text-sm text-balance text-muted-foreground">
                    {isSignUp
                        ? 'Enter your details to create your admin account'
                        : 'Enter your credentials to access the admin dashboard'}
                </p>
            </div>

            <form
                action={async (formData) => {
                    setIsLoading(true)
                    if (isSignUp) {
                        await signup(formData)
                    } else {
                        await login(formData)
                    }
                    setIsLoading(false)
                }}
                className="space-y-4"
            >
                <div className="space-y-4">
                    {isSignUp && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="text-[#1F4E5F]">First name</Label>
                                <Input
                                    id="first_name"
                                    name="first_name"
                                    required
                                    className="h-11 border-zinc-200 bg-transparent px-4 shadow-sm focus-visible:ring-[#E05D34] focus-visible:border-[#E05D34]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="text-[#1F4E5F]">Last name</Label>
                                <Input
                                    id="last_name"
                                    name="last_name"
                                    required
                                    className="h-11 border-zinc-200 bg-transparent px-4 shadow-sm focus-visible:ring-[#E05D34] focus-visible:border-[#E05D34]"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-[#1F4E5F]">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="h-11 border-zinc-200 bg-transparent px-4 shadow-sm focus-visible:ring-[#E05D34] focus-visible:border-[#E05D34]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-[#1F4E5F]">Password</Label>
                        {/* Forgot password removed */}
                    </div>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="h-11 border-zinc-200 bg-transparent px-4 shadow-sm focus-visible:ring-[#E05D34] focus-visible:border-[#E05D34]"
                    />
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-500 text-center animate-in zoom-in-95">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-[#1F4E5F] hover:bg-[#163C4A] text-white font-medium shadow-md shadow-[#1F4E5F]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </Button>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground">
                        {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="font-medium text-[#E05D34] hover:underline underline-offset-4"
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>
            </form>

            <p className="px-8 text-center text-sm text-muted-foreground">
                By clicking continue, you agree to our{" "}
                <a href="#" className="underline underline-offset-4 hover:text-[#E05D34]">
                    Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline underline-offset-4 hover:text-[#E05D34]">
                    Privacy Policy
                </a>
                .
            </p>
        </div>
    )
}
