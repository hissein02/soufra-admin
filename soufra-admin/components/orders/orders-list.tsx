"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Order } from "@/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditOrderForm } from "@/components/forms/edit-order-form"
import { QuickStatusButton } from "@/components/orders/quick-status-button"
import { DeleteOrderButton } from "@/components/orders/delete-order-button"
import { formatPrice } from "@/lib/utils"
import { Clock, MapPin } from "lucide-react"

interface OrdersListProps {
    initialOrders: Order[]
    restaurantId: string
    allItems: any[]
}

export function OrdersList({ initialOrders, restaurantId, allItems }: OrdersListProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const supabase = createClient()

    const refreshOrders = async () => {
        setIsRefreshing(true)
        try {
            const { data } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false })

            if (data) {
                setOrders(data as Order[])
            }
        } catch (error) {
            console.error('Error refreshing orders:', error)
        } finally {
            setIsRefreshing(false)
        }
    }

    // Auto-refresh every 15 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing orders...')
            refreshOrders()
        }, 15000) // 15 seconds

        return () => clearInterval(interval)
    }, [restaurantId])

    useEffect(() => {
        // Setup realtime subscription
        const channel = supabase
            .channel(`orders:${restaurantId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`
                },
                async (payload) => {
                    console.log('INSERT', payload)
                    // Wait for order_items to be inserted (they're in a separate table)
                    await new Promise(resolve => setTimeout(resolve, 500))

                    // Fetch complete order with items
                    const { data } = await supabase
                        .from('orders')
                        .select('*, order_items(*)')
                        .eq('id', payload.new.id)
                        .single()

                    if (data) {
                        setOrders(prev => [data as Order, ...prev])
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`
                },
                async (payload) => {
                    console.log('UPDATE', payload)
                    // Fetch complete updated order
                    const { data } = await supabase
                        .from('orders')
                        .select('*, order_items(*)')
                        .eq('id', payload.new.id)
                        .single()

                    if (data) {
                        setOrders(prev =>
                            prev.map(order =>
                                order.id === data.id ? data as Order : order
                            )
                        )
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`
                },
                (payload) => {
                    console.log('DELETE', payload)
                    setOrders(prev => prev.filter(order => order.id !== payload.old.id))
                }
            )
            .subscribe()

        // Cleanup
        return () => {
            supabase.removeChannel(channel)
        }
    }, [restaurantId, supabase])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500 text-white border-yellow-600'
            case 'preparing': return 'bg-blue-500 text-white border-blue-600'
            case 'ready': return 'bg-green-500 text-white border-green-600'
            case 'completed': return 'bg-gray-500 text-white border-gray-600'
            case 'cancelled': return 'bg-red-500 text-white border-red-600'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                No orders yet.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshOrders}
                    disabled={isRefreshing}
                >
                    <svg
                        className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
            </div>
            {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden border-2 hover:border-[#1F4E5F]/20 transition-colors">
                    <CardHeader className="bg-gray-50/50 pb-4 border-b">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm text-gray-500">#{order.id.slice(0, 8)}</span>
                                    <Badge variant="outline" className={`${getStatusColor(order.status)} uppercase text - xs font - semibold`}>
                                        {order.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-4 mt-2">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(order.created_at).toLocaleString()}
                                    </span>
                                    {order.table_number && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            Table {order.table_number}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <Badge variant="secondary" className="font-mono text-base font-bold bg-[#1F4E5F]/5 text-[#1F4E5F] px-3 hover:bg-[#1F4E5F]/5">
                                    {formatPrice(order.total_amount)}
                                </Badge>
                                <div className="flex items-center gap-2">
                                    <QuickStatusButton order={order} restaurantId={restaurantId} />
                                    <EditOrderForm restaurantId={restaurantId} order={order} menuItems={allItems} />
                                    <DeleteOrderButton order={order} restaurantId={restaurantId} />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            {order.order_items?.map((item) => (
                                <div key={item.id} className="flex items-start justify-between text-sm group">
                                    <div className="flex gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded text-xs font-medium text-gray-600">
                                            {item.quantity}x
                                        </div>
                                        <div className="space-y-1">
                                            <span className="font-medium text-gray-900">{item.name}</span>

                                            {/* DEBUG: Log to see structure */}
                                            {item.selected_options && console.log('Item:', item.name, 'Options:', item.selected_options)}

                                            {/* Display set menu contents - check for item_id in selected_options */}
                                            {item.selected_options && Array.isArray(item.selected_options) && item.selected_options.some((opt: any) => opt.item_id) && (
                                                <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-blue-200 bg-blue-50/30 p-2 rounded">
                                                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Set Includes:</p>
                                                    {item.selected_options
                                                        .filter((opt: any) => opt.item_id)
                                                        .map((opt: any, idx: number) => {
                                                            // Look up the referenced item from allItems
                                                            const referencedItem = allItems.find((menuItem: any) => menuItem.id === opt.item_id)

                                                            return (
                                                                <div key={idx} className="space-y-1">
                                                                    <p className="text-xs font-medium text-blue-900">
                                                                        📦 {opt.group_name}: {opt.choice_name}
                                                                    </p>
                                                                    {referencedItem && referencedItem.description && (
                                                                        <p className="text-xs text-gray-500 pl-4 italic">
                                                                            {referencedItem.description}
                                                                        </p>
                                                                    )}
                                                                    {referencedItem && referencedItem.steps && (
                                                                        <div className="pl-4 mt-1 text-xs text-gray-600">
                                                                            <p className="font-medium text-gray-700">Preparation:</p>
                                                                            <p className="whitespace-pre-line">{referencedItem.steps}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                </div>
                                            )}

                                            {/* Display steps for regular items */}
                                            {item.steps && (
                                                <div className="mt-2 pl-3 border-l-2 border-gray-200 bg-gray-50/50 p-2 rounded">
                                                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Preparation:</p>
                                                    <p className="text-xs text-gray-600 whitespace-pre-line mt-1">{item.steps}</p>
                                                </div>
                                            )}

                                            {/* Display regular options (non-set items) */}
                                            {item.selected_options && Array.isArray(item.selected_options) && item.selected_options.filter((opt: any) => !opt.item_id).length > 0 && (
                                                <div className="text-xs space-y-2 mt-2">
                                                    {/* Group options by group_name */}
                                                    {Object.entries(
                                                        item.selected_options
                                                            .filter((opt: any) => !opt.item_id)
                                                            .reduce((groups: any, opt: any) => {
                                                                const groupName = opt.group_name || 'Options'
                                                                if (!groups[groupName]) groups[groupName] = []
                                                                groups[groupName].push(opt)
                                                                return groups
                                                            }, {})
                                                    ).map(([groupName, options]: [string, any], groupIdx) => (
                                                        <div key={groupIdx} className="pl-2 border-l-2 border-gray-200">
                                                            <p className="font-medium text-gray-600 mb-0.5">{groupName}:</p>
                                                            <div className="pl-2 space-y-0.5">
                                                                {options.map((opt: any, idx: number) => (
                                                                    <p key={idx} className="text-gray-500 flex items-center gap-1">
                                                                        <span>• {opt.name}</span>
                                                                        {opt.price > 0 && (
                                                                            <span className="text-orange-600 font-medium">
                                                                                (+{formatPrice(opt.price)})
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="font-medium text-gray-600">
                                        {formatPrice(item.price_at_time * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
