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
import { updateMenuItem } from '@/app/dashboard/actions'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SetMenuBuilder } from './set-menu-builder'
import { MenuOptions } from '@/types'

interface MenuItem {
    id: string
    name: string
    description: string
    price: number
    image_url: string
    is_available: boolean
    item_type?: string
    options?: any
}

export function EditItemForm({ restaurantId, item, existingItems = [] }: { restaurantId: string, item: MenuItem, existingItems?: any[] }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [itemType, setItemType] = useState(item.item_type || 'single')
    // Ensure options is an array (handle legacy data)
    const [options, setOptions] = useState<MenuOptions>(Array.isArray(item.options) ? item.options : [])

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        formData.append('item_type', itemType)
        formData.append('options', JSON.stringify(options))

        const result = await updateMenuItem(restaurantId, item.id, formData)
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
                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm bg-white/90 hover:bg-white">
                    <Pencil className="h-4 w-4 text-gray-700" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[80vw] max-w-[95vw] max-h-[90vh] overflow-y-auto w-full">
                <DialogHeader>
                    <DialogTitle>Edit Menu Item</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-6 py-4">

                    <div className="flex items-start justify-between">
                        <div className="space-y-3">
                            <Label>Item Type</Label>
                            <RadioGroup value={itemType} onValueChange={setItemType} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="single" id="single-edit" />
                                    <Label htmlFor="single-edit">Single Item</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="set_menu" id="set_menu-edit" />
                                    <Label htmlFor="set_menu-edit">Set Menu (Formule)</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="flex items-center space-x-2 border p-2 rounded-lg bg-gray-50">
                            <input
                                type="checkbox"
                                id="is_available"
                                name="is_available"
                                className="h-4 w-4 rounded border-gray-300 text-[#E05D34] focus:ring-[#E05D34]"
                                defaultChecked={item.is_available}
                            />
                            <Label htmlFor="is_available" className="font-medium cursor-pointer">Available</Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" required defaultValue={item.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (FCFA)</Label>
                            <Input id="price" name="price" type="number" step="1" required defaultValue={item.price} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" defaultValue={item.description} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image_url">Image URL</Label>
                        <Input id="image_url" name="image_url" defaultValue={item.image_url} placeholder="https://..." />
                    </div>

                    {itemType === 'set_menu' && (
                        <div className="pt-2 border-t">
                            <SetMenuBuilder value={options} onChange={setOptions} existingItems={existingItems} />
                        </div>
                    )}


                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-[#E05D34] hover:bg-[#c94e2a]">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
