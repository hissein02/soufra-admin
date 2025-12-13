'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
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
import { createMenuItem } from '@/app/dashboard/actions'
import { SetMenuBuilder } from './set-menu-builder'
import { MenuOptions } from '@/types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function AddItemForm({ restaurantId, categoryId, existingItems = [] }: { restaurantId: string, categoryId: string, existingItems?: any[] }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [itemType, setItemType] = useState('single')
    const [options, setOptions] = useState<MenuOptions>([])

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        // Append extra data
        formData.append('item_type', itemType)
        formData.append('options', JSON.stringify(options))

        const result = await createMenuItem(restaurantId, categoryId, formData)
        setIsLoading(false)

        if (result?.error) {
            alert(result.error)
        } else {
            setOpen(false)
            setOptions([]) // Reset
            setItemType('single')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-[#E05D34] hover:bg-[#c94e2a]">
                    <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[80vw] max-w-[95vw] max-h-[90vh] overflow-y-auto w-full">
                <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-6 py-4">

                    <div className="flex items-start justify-between">
                        <div className="space-y-3">
                            <Label>Item Type</Label>
                            <RadioGroup defaultValue="single" value={itemType} onValueChange={setItemType} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="single" id="single" />
                                    <Label htmlFor="single">Single Item</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="set_menu" id="set_menu" />
                                    <Label htmlFor="set_menu">Set Menu (Formule)</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="flex items-center space-x-2 border p-2 rounded-lg bg-gray-50">
                            <input
                                type="checkbox"
                                id="is_available"
                                name="is_available"
                                className="h-4 w-4 rounded border-gray-300 text-[#E05D34] focus:ring-[#E05D34]"
                                defaultChecked
                            />
                            <Label htmlFor="is_available" className="font-medium cursor-pointer">Available</Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" required placeholder="e.g., Burger" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (FCFA)</Label>
                            <Input id="price" name="price" type="number" step="1" required placeholder="0" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" placeholder="Description..." />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image_url">Image URL</Label>
                        <Input id="image_url" name="image_url" placeholder="https://..." />
                    </div>

                    {itemType === 'set_menu' && (
                        <div className="pt-2 border-t">
                            <SetMenuBuilder value={options} onChange={setOptions} existingItems={existingItems} />
                        </div>
                    )}



                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-[#E05D34] hover:bg-[#c94e2a]">
                            Create Item
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
