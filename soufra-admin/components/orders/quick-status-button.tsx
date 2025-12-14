"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Order } from "@/types"
import { updateOrder } from "@/app/dashboard/actions"
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react"

interface QuickStatusButtonProps {
    order: Order
    restaurantId: string
}

export function QuickStatusButton({ order, restaurantId }: QuickStatusButtonProps) {
    const [loading, setLoading] = useState(false)

    const getNextStatus = (status: string, type: string) => {
        const flows: Record<string, string[]> = {
            'dine_in': ['pending', 'confirmed', 'preparing', 'ready', 'served'],
            // Use take_away here as per user request to fix typo
            'take_away': ['pending', 'confirmed', 'preparing', 'ready', 'completed'],
            'delivery': ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
        }

        // Fallback for existing 'take_out' data if any, map it to take_away flow
        const effectiveType = type === 'take_out' ? 'take_away' : type
        const flow = flows[effectiveType] || flows['dine_in']

        const currentIndex = flow.indexOf(status)
        if (currentIndex === -1 || currentIndex === flow.length - 1) return null

        return flow[currentIndex + 1]
    }

    const nextStatus = getNextStatus(order.status, order.order_type)

    if (!nextStatus) return null

    const handleUpdate = async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent opening the edit modal if clicked
        e.preventDefault()

        setLoading(true)
        try {
            await updateOrder(restaurantId, order.id, {
                status: nextStatus,
            })
            // UI will be updated automatically via realtime subscription
            console.log('✅ Order status updated to:', nextStatus)
        } catch (error) {
            console.error("Failed to update status", error)
            alert("Failed to update status")
        } finally {
            setLoading(false)
        }
    }

    const getLabel = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    return (
        <Button
            size="sm"
            variant="outline"
            onClick={handleUpdate}
            disabled={loading}
            className="h-8 gap-2 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
        >
            {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
                <>
                    <span className="text-xs font-medium">Mark {getLabel(nextStatus)}</span>
                    <ArrowRight className="h-3 w-3" />
                </>
            )}
        </Button>
    )
}
