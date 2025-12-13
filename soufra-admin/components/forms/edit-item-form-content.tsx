'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateMenuItem } from '@/app/dashboard/actions'
import { useRouter } from 'next/navigation'

interface MenuItem {
    id: string
    name: string
    description: string
    price: number
    image_url: string
    is_available: boolean
}

export function EditItemFormContent({ restaurantId, item }: { restaurantId: string, item: MenuItem }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await updateMenuItem(restaurantId, item.id, formData)
        setIsLoading(false)

        if (result?.error) {
            alert(result.error)
        } else {
            router.push(`/dashboard/restaurants/${restaurantId}`)
            router.refresh()
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required defaultValue={item.name} className="max-w-md" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={item.description} className="max-w-md" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input id="price" name="price" type="number" step="0.01" required defaultValue={item.price} className="max-w-[120px]" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input id="image_url" name="image_url" defaultValue={item.image_url} placeholder="https://..." className="max-w-md" />
                {item.image_url && (
                    <div className="mt-2 relative w-full h-40 max-w-md rounded-md overflow-hidden bg-gray-100 border">
                        <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
            </div>
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="is_available"
                    name="is_available"
                    className="h-4 w-4 rounded border-gray-300 text-[#E05D34] focus:ring-[#E05D34]"
                    defaultChecked={item.is_available}
                />
                <Label htmlFor="is_available">Is Available</Label>
            </div>
            <div className="pt-4">
                <Button type="submit" disabled={isLoading} className="bg-[#E05D34] hover:bg-[#c94e2a]">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    )
}
