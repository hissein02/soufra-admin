
import { LoginForm } from '@/components/auth/login-form'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams
    const error = searchParams.error

    return (
        <div className="flex min-h-[100dvh] w-full items-center justify-center bg-white px-4 dark:bg-zinc-950">
            <LoginForm error={error} />
        </div>
    )
}
