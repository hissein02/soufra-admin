"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { Order } from "@/types"
import { deleteOrder } from "@/app/dashboard/actions"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeleteOrderButtonProps {
    order: Order
    restaurantId: string
}

export function DeleteOrderButton({ order, restaurantId }: DeleteOrderButtonProps) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const handleDelete = async () => {
        setLoading(true)
        try {
            const result = await deleteOrder(restaurantId, order.id)
            if (result.error) {
                alert(`Error: ${result.error}`)
            } else {
                setOpen(false)
                // UI will be updated automatically via realtime subscription
                console.log('✅ Order deleted successfully')
            }
        } catch (error) {
            console.error("Failed to delete order", error)
            alert("Failed to delete order")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Order</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete order <span className="font-mono font-semibold">#{order.id.slice(0, 8)}</span>?
                        This action cannot be undone and will permanently remove the order and all its items.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e: React.MouseEvent) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete Order"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
