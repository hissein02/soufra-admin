'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateCategory } from '@/app/dashboard/actions'

interface Category {
    id: string
    name: string
    sort_order: number
}

export function EditCategoryForm({ restaurantId, category }: { restaurantId: string, category: Category }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await updateCategory(restaurantId, category.id, formData)
        setIsLoading(false)

        if (result?.error) {
            alert(result.error)
        } else {
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-[#1F4E5F]">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" required defaultValue={category.name} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sort_order">Sort Order</Label>
                        <Input id="sort_order" name="sort_order" type="number" defaultValue={category.sort_order} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-[#1F4E5F] hover:bg-[#163C4A]">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
