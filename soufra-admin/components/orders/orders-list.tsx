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

function OrderTimer({ order }: { order: Order }) {
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        const start = new Date(order.created_at).getTime()
        const isFinished = ['served', 'completed', 'delivered', 'cancelled'].includes(order.status)

        if (isFinished && order.updated_at) {
            const end = new Date(order.updated_at).getTime()
            setElapsed(Math.floor((end - start) / 1000))
            return
        }

        // If not finished, or finished but missing updated_at (fallback), keep running or calc from now
        const update = () => {
            const now = isFinished && order.updated_at ? new Date(order.updated_at).getTime() : Date.now()
            setElapsed(Math.floor((now - start) / 1000))
        }

        update()
        if (!isFinished) {
            const timer = setInterval(update, 1000)
            return () => clearInterval(timer)
        }
    }, [order.created_at, order.updated_at, order.status])

    const formatDuration = (seconds: number) => {
        if (seconds < 0) return "0s"
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60

        if (h > 0) return `${h}h ${m}m ${s}s`
        return `${m}m ${s}s`
    }

    return (
        <Badge variant="outline" className="font-mono text-xs font-bold bg-gray-100/50 text-gray-700 border-gray-200">
            ⏱ {formatDuration(elapsed)}
        </Badge>
    )
}

export function OrdersList({ initialOrders, restaurantId, allItems }: OrdersListProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const supabase = createClient()

    // Derived state for Active vs Past
    const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status))
    const pastOrders = orders
        .filter(o => ['delivered', 'served', 'completed'].includes(o.status) && o.status !== 'cancelled')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const refreshOrders = async () => {
        setIsRefreshing(true)
        // Refresh handled via server component re-fetch effectively, or manually calling action
        // Since we are client side, we can call the action
        // Re-using the same action as initial fetch for consistency
        const { getOrders } = await import('@/app/dashboard/actions')
        const latestOrders = await getOrders(restaurantId) as Order[]
        setOrders(latestOrders)
        setIsRefreshing(false)
    }

    // Realtime subscription setup
    useEffect(() => {
        const channel = supabase.channel('orders-realtime')
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
                    // Logic: Only add if it belongs to current business day.
                    // New orders usually do. But let's check created_at >= cutoff logic if needed?
                    // Typically INSERT is "now", so it's active.
                    const { data } = await supabase
                        .from('orders')
                        .select('*, order_items(*)')
                        .eq('id', payload.new.id)
                        .single()

                    if (data) {
                        setOrders(prev => [...prev, data as Order])
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
                    const newStatus = payload.new.status

                    // If cancelled, remove.
                    if (newStatus === 'cancelled') {
                        setOrders(prev => prev.filter(o => o.id !== payload.new.id))
                        return
                    }

                    // Otherwise update or add
                    // Fetch complete updated order
                    const { data } = await supabase
                        .from('orders')
                        .select('*, order_items(*)')
                        .eq('id', payload.new.id)
                        .single()

                    if (data) {
                        setOrders(prev => {
                            const exists = prev.some(o => o.id === data.id)
                            if (exists) {
                                return prev.map(order => order.id === data.id ? data as Order : order)
                            } else {
                                // If it didn't exist (maybe refreshed from Past/Active boundary or race condition), add it
                                return [...prev, data as Order].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                            }
                        })
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

        return () => {
            supabase.removeChannel(channel)
        }
    }, [restaurantId, supabase])

    const getOrderStyles = (status: string) => {
        switch (status) {
            case 'pending': return {
                ticket: 'border-amber-200 bg-amber-50 text-amber-900',
                header: 'border-amber-200/50 bg-amber-100/40',
                badge: 'bg-amber-100 text-amber-700 border-amber-200',
                divider: 'border-amber-200/50'
            }
            case 'confirmed': return {
                ticket: 'border-orange-200 bg-orange-50 text-orange-900',
                header: 'border-orange-200/50 bg-orange-100/40',
                badge: 'bg-orange-100 text-orange-700 border-orange-200',
                divider: 'border-orange-200/50'
            }
            case 'preparing': return {
                ticket: 'border-sky-200 bg-sky-50 text-sky-900',
                header: 'border-sky-200/50 bg-sky-100/40',
                badge: 'bg-sky-100 text-sky-700 border-sky-200',
                divider: 'border-sky-200/50'
            }
            case 'ready': return {
                ticket: 'border-emerald-200 bg-emerald-50 text-emerald-900',
                header: 'border-emerald-200/50 bg-emerald-100/40',
                badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                divider: 'border-emerald-200/50'
            }
            case 'completed':
            case 'served':
            case 'delivered': return {
                ticket: 'border-slate-200 bg-slate-50 text-slate-700 opacity-75',
                header: 'border-slate-200/50 bg-slate-100/50',
                badge: 'bg-slate-100 text-slate-600 border-slate-200',
                divider: 'border-slate-200/50'
            }
            case 'cancelled': return {
                ticket: 'border-rose-200 bg-rose-50 text-rose-900',
                header: 'border-rose-200/50 bg-rose-100/40',
                badge: 'bg-rose-100 text-rose-700 border-rose-200',
                divider: 'border-rose-200'
            }
            default: return {
                ticket: 'border-stone-200 bg-white text-stone-700',
                header: 'border-stone-100 bg-stone-50',
                badge: 'bg-stone-100 text-stone-600 border-stone-200',
                divider: 'border-stone-200'
            }
        }
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                No active orders.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight">Active Orders</h2>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                        {activeOrders.length}
                    </Badge>
                </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {activeOrders.map((order) => {
                    const styles = getOrderStyles(order.status)
                    const timeElapsed = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000)

                    return (
                        <div
                            key={order.id}
                            className={`relative flex flex-col font-mono shadow-md transition-all duration-200 ${styles.ticket}`}
                        >
                            {/* Jagged Edge Top (simulated with dashed border) */}
                            <div className={`absolute -top-1 left-0 right-0 h-2 bg-transparent border-t-4 border-dotted ${styles.ticket.split(' ')[0]}`}></div>

                            <Card
                                className={`rounded-none border-x-2 border-y-0 border-dashed ${styles.ticket} bg-transparent shadow-none h-full`}
                            >
                                <CardHeader className={`pb-3 border-b-2 border-dashed ${styles.divider} ${styles.header} pt-4`}>
                                    <div className="flex items-start justify-between w-full">
                                        <div className="flex flex-col gap-1.5">
                                            <div className={`border-2 ${styles.badge} px-2 py-0.5 w-fit uppercase text-[10px] tracking-wider font-bold`}>
                                                {order.status.replace('_', ' ')}
                                            </div>
                                            <span className="text-xs opacity-75">
                                                ID: {order.id.slice(0, 8)}
                                            </span>
                                        </div>

                                        {order.table_number ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] uppercase tracking-widest opacity-60">Table</span>
                                                <span className="text-5xl font-black leading-none tracking-tighter">
                                                    {order.table_number}
                                                </span>
                                            </div>
                                        ) : (
                                            order.order_type !== 'dine_in' && (
                                                <div className="flex flex-col items-end opacity-60">
                                                    <span className="text-[10px] uppercase tracking-widest">Type</span>
                                                    <span className="text-xl font-bold uppercase tracking-wide">
                                                        {order.order_type === 'take_away' ? 'Takeaway' : 'Delivery'}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {/* Special Request Display - Ticket Style */}
                                    {order.special_request && (
                                        <div className="mt-4 pt-3 border-t-2 border-dashed border-red-300/50">
                                            <p className="text-[10px] uppercase font-bold text-red-600 mb-1">*** NOTE ***</p>
                                            <p className="font-bold text-sm text-red-700 uppercase leading-snug">
                                                {order.special_request}
                                            </p>
                                        </div>
                                    )}
                                </CardHeader>

                                <CardContent className="pt-4 flex flex-col h-[calc(100%-auto)] justify-between flex-1">
                                    <div className="mb-6">
                                        <div className="space-y-3">
                                            {order.order_items?.map((item) => (
                                                <div key={item.id} className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-white border border-gray-200 rounded-md shadow-sm text-sm font-bold text-gray-700">
                                                        {item.quantity}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 leading-tight">
                                                            {item.name}
                                                        </p>

                                                        {/* Set Items & Options */}
                                                        {(item.selected_options && item.selected_options.length > 0) || item.steps ? (
                                                            <div className="mt-1.5 space-y-1">
                                                                {/* Set Items */}
                                                                {item.selected_options
                                                                    ?.filter((opt: any) => opt.item_id)
                                                                    .map((opt: any, idx: number) => (
                                                                        <div key={`set-${idx}`} className="text-xs text-gray-600 flex items-start gap-1.5 pl-1">
                                                                            <span className="text-[10px] mt-0.5 text-gray-400">↳</span>
                                                                            <span className="font-medium text-gray-700">{opt.group_name}:</span>
                                                                            <span>
                                                                                {opt.choice_name}
                                                                                {opt.price > 0 && (
                                                                                    <span className="text-orange-600 ml-1">
                                                                                        (+{formatPrice(opt.price)})
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    ))
                                                                }

                                                                {/* Regular Options - Grouped */}
                                                                {item.selected_options && item.selected_options.some((opt: any) => !opt.item_id) && (
                                                                    <div className="space-y-2 mt-1.5">
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
                                                                            <div key={`group-${groupIdx}`} className="text-xs">
                                                                                <p className="font-semibold text-gray-700 mb-0.5">{groupName}:</p>
                                                                                <div className="pl-2 space-y-1 border-l-2 border-gray-200 ml-0.5">
                                                                                    {options.map((opt: any, optIdx: number) => (
                                                                                        <div key={optIdx} className="text-gray-600 flex items-center gap-1.5">
                                                                                            <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                                                                                            <span>{opt.name}</span>
                                                                                            {(opt.price > 0 || opt.extra_price > 0) && (
                                                                                                <span className="text-orange-600 text-[10px] font-medium">
                                                                                                    (+{formatPrice(opt.price || opt.extra_price)})
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Notes/Steps */}
                                                                {item.steps && (
                                                                    <div className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-100 mt-1">
                                                                        <span className="font-semibold text-[10px] uppercase mr-1">Note:</span>
                                                                        {item.steps}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-400/30">
                                        <div className="flex items-center justify-between text-sm mb-4">
                                            <div className="flex items-center gap-2">
                                                <OrderTimer order={order} />
                                                <div className="flex items-center gap-1.5 opacity-75" title={new Date(order.created_at).toLocaleString()}>
                                                    <span className="text-xs font-bold tracking-widest uppercase">
                                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="font-black text-xl tracking-tight">
                                                {formatPrice(order.total_amount)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex-1">
                                                <QuickStatusButton order={order} restaurantId={restaurantId} />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <EditOrderForm restaurantId={restaurantId} order={order} menuItems={allItems} />
                                                <DeleteOrderButton order={order} restaurantId={restaurantId} />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>

                                {/* Jagged Edge Bottom (simulated) */}
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-transparent border-t-2 border-transparent"
                                    style={{
                                        backgroundImage: `linear-gradient(45deg, transparent 33.333%, #ffffff 33.333%, #ffffff 66.667%, transparent 66.667%), linear-gradient(-45deg, transparent 33.333%, #ffffff 33.333%, #ffffff 66.667%, transparent 66.667%)`,
                                        backgroundSize: '8px 16px',
                                        backgroundPosition: '0 100%',
                                        opacity: 0 // Keep invisible for now, sticking to dashed borders for safety
                                    }}
                                ></div>
                                <div className="h-1 w-full border-t-2 border-dashed opacity-20"></div>
                            </Card>
                        </div>
                    )
                })}
            </div>

            {pastOrders.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-xl font-bold text-gray-500 mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        Past Orders (Today)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 grayscale-[0.3]">
                        {pastOrders.map((order) => {
                            const styles = getOrderStyles(order.status)

                            return (
                                <div
                                    key={order.id}
                                    className={`relative flex flex-col font-mono shadow-sm transition-all duration-200 ${styles.ticket}`}
                                >
                                    {/* Jagged Edge Top (simulated with dashed border) */}
                                    <div className={`absolute -top-1 left-0 right-0 h-2 bg-transparent border-t-4 border-dotted ${styles.ticket.split(' ')[0]}`}></div>

                                    <Card
                                        className={`rounded-none border-x-2 border-y-0 border-dashed ${styles.ticket} bg-transparent shadow-none h-full`}
                                    >
                                        <CardHeader className={`pb-3 border-b-2 border-dashed ${styles.divider} ${styles.header} pt-4`}>
                                            <div className="flex items-start justify-between w-full">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className={`border-2 ${styles.badge} px-2 py-0.5 w-fit uppercase text-[10px] tracking-wider font-bold`}>
                                                        {order.status.replace('_', ' ')}
                                                    </div>
                                                    <span className="text-xs opacity-75">
                                                        ID: {order.id.slice(0, 8)}
                                                    </span>
                                                </div>

                                                {order.table_number ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] uppercase tracking-widest opacity-60">Table</span>
                                                        <span className="text-5xl font-black leading-none tracking-tighter">
                                                            {order.table_number}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    order.order_type !== 'dine_in' && (
                                                        <div className="flex flex-col items-end opacity-60">
                                                            <span className="text-[10px] uppercase tracking-widest">Type</span>
                                                            <span className="text-xl font-bold uppercase tracking-wide">
                                                                {order.order_type === 'take_away' ? 'Takeaway' : 'Delivery'}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                            {/* Special Request Display - Ticket Style */}
                                            {order.special_request && (
                                                <div className="mt-4 pt-3 border-t-2 border-dashed border-red-300/50">
                                                    <p className="text-[10px] uppercase font-bold text-red-600 mb-1">*** NOTE ***</p>
                                                    <p className="font-bold text-sm text-red-700 uppercase leading-snug">
                                                        {order.special_request}
                                                    </p>
                                                </div>
                                            )}
                                        </CardHeader>

                                        <CardContent className="pt-4 flex flex-col h-[calc(100%-auto)] justify-between flex-1">
                                            <div className="mb-6">
                                                <div className="space-y-3">
                                                    {order.order_items?.map((item) => (
                                                        <div key={item.id} className="text-sm">
                                                            <div className="flex justify-between items-start font-bold">
                                                                <span className="flex gap-2">
                                                                    <span>{item.quantity}x</span>
                                                                    <span>{item.name}</span>
                                                                </span>
                                                                <span>{formatPrice(item.price_at_time * item.quantity)}</span>
                                                            </div>
                                                            {/* Options Display */}
                                                            {item.selected_options && Array.isArray(item.selected_options) && item.selected_options.length > 0 && (
                                                                <div className="ml-6 mt-1 space-y-0.5">
                                                                    {/* Simple List for Past Orders to save space? Or same logic? Same logic for consistency. */}
                                                                    {item.selected_options.map((opt: any, idx: number) => (
                                                                        <div key={idx} className="text-xs opacity-80 flex items-center gap-1.5">
                                                                            <span className="w-1 h-1 rounded-full bg-current flex-shrink-0" />
                                                                            <span>{opt.choice_name || opt.name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {item.steps && (
                                                                <div className="ml-6 mt-1 text-xs italic opacity-80">
                                                                    Note: {item.steps}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-400/30">
                                                <div className="flex items-center justify-between text-sm mb-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 opacity-60 text-[10px] uppercase tracking-wider">
                                                            <span>Ordered:</span>
                                                            <span className="font-bold font-mono">
                                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                            </span>
                                                        </div>
                                                        {order.updated_at && (
                                                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold opacity-90">
                                                                <span>{order.status === 'out_for_delivery' ? 'Delivered' : order.status}:</span>
                                                                <span className="font-mono">
                                                                    {new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                                </span>
                                                                <span className="text-gray-500 font-medium normal-case tracking-normal ml-1">
                                                                    ({Math.floor((new Date(order.updated_at).getTime() - new Date(order.created_at).getTime()) / 60000)}m)
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-black text-xl tracking-tight">
                                                        {formatPrice(order.total_amount)}
                                                    </span>
                                                </div>

                                                {/* No Actions for Past Orders? Or maybe just Delete? User didn't specify. Keeping Delete is safe. QuickStatus probably not needed if it's done. But maybe re-open? Let's leave Actions but maybe simplified? User just said 'display'. I'll keep them for consistency/correction. */}
                                                <div className="flex items-center justify-end gap-1">
                                                    <DeleteOrderButton order={order} restaurantId={restaurantId} />
                                                </div>
                                            </div>
                                        </CardContent>

                                        {/* Jagged Edge Bottom (simulated) */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-transparent border-t-2 border-transparent"
                                            style={{
                                                backgroundImage: `linear-gradient(45deg, transparent 33.333%, #ffffff 33.333%, #ffffff 66.667%, transparent 66.667%), linear-gradient(-45deg, transparent 33.333%, #ffffff 33.333%, #ffffff 66.667%, transparent 66.667%)`,
                                                backgroundSize: '8px 16px',
                                                backgroundPosition: '0 100%',
                                                opacity: 0 // Keep invisible
                                            }}
                                        ></div>
                                        <div className="h-1 w-full border-t-2 border-dashed opacity-20"></div>
                                    </Card>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
