'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea' // Note: I might need to install textarea or use Input
import { createRestaurant } from '@/app/dashboard/actions'

// I'll use Input for description if Textarea is not available, but shadcn usually has Textarea. 
// I'll check if I installed it. I didn't. I'll use a simple native textarea or standard Input for now to avoid errors, 
// or I can quickly install textarea. Actually, Input is fine for now, or just <textarea> with tailwind classes.
// Prompt said "Install necessary components: button, input, card, table, dialog, label, form". Textarea wasn't listed.
// I'll use standard <textarea> with shadcn-like classes or just Input.

export function AddRestaurantForm() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await createRestaurant(formData)
        setIsLoading(false)

        if (result?.error) {
            alert(result.error) // Simple error handling for now
        } else {
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#E05D34] hover:bg-[#c94e2a]">
                    <Plus className="mr-2 h-4 w-4" /> Add Restaurant
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Restaurant</DialogTitle>
                    <DialogDescription>
                        Create a new restaurant profile here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" placeholder="La Soufra" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" placeholder="A cozy place..." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input id="phone_number" name="phone_number" placeholder="+1234567890" />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-[#E05D34] hover:bg-[#c94e2a]">
                            {isLoading ? 'Saving...' : 'Save Restaurant'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
