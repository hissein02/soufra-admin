'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toggleMenuItemAvailability } from '@/app/dashboard/actions'
import { cn } from '@/lib/utils'

interface ItemAvailabilityToggleProps {
    restaurantId: string
    itemId: string
    isAvailable: boolean
}

export function ItemAvailabilityToggle({ restaurantId, itemId, isAvailable: initialIsAvailable }: ItemAvailabilityToggleProps) {
    const [isAvailable, setIsAvailable] = useState(initialIsAvailable)
    const [isLoading, setIsLoading] = useState(false)

    const handleToggle = async (checked: boolean) => {
        setIsAvailable(checked) // Optimistic update
        setIsLoading(true)
        const result = await toggleMenuItemAvailability(restaurantId, itemId, checked)
        setIsLoading(false)

        if (result?.error) {
            alert(result.error)
            setIsAvailable(!checked) // Revert on error
        }
    }

    return (
        <div className="flex items-center space-x-2">
            <Switch
                id={`availability-${itemId}`}
                checked={isAvailable}
                onCheckedChange={handleToggle}
                disabled={isLoading}
                className={cn(
                    "data-[state=checked]:bg-[#1F4E5F]",
                    "data-[state=unchecked]:bg-gray-200"
                )}
            />
            <Label
                htmlFor={`availability-${itemId}`}
                className={cn(
                    "text-xs font-medium cursor-pointer",
                    isAvailable ? "text-[#1F4E5F]" : "text-gray-400"
                )}
            >
                {isAvailable ? 'Available' : 'Unavailable'}
            </Label>
        </div>
    )
}
