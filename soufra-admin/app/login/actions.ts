'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/login?error=Invalid credentials')
    }

    if (authData.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single()

        if (profile?.role !== 'super_admin') {
            await supabase.auth.signOut()
            redirect('/unauthorized')
        }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
            data: {
                first_name: formData.get('first_name') as string,
                last_name: formData.get('last_name') as string,
                role: 'super_admin', // Attempt to set role via metadata for dev environment
            }
        }
    }

    const { data: authData, error } = await supabase.auth.signUp(data)

    if (error) {
        redirect('/login?error=' + error.message)
    }

    if (authData.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single()

        if (profile?.role !== 'super_admin') {
            await supabase.auth.signOut()
            redirect('/unauthorized')
        }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
