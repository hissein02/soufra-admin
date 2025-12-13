import { notFound } from 'next/navigation'
import { getRestaurantBySlug, getOrders, getCategories } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, MapPin, User, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Order, OrderItem } from '@/types'
import { formatPrice } from '@/lib/utils'
import { AddOrderForm } from '@/components/forms/add-order-form'
import { EditOrderForm } from '@/components/forms/edit-order-form'
import { QuickStatusButton } from '@/components/orders/quick-status-button'

export default async function OrdersPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params
    const { slug } = params

    const restaurant = await getRestaurantBySlug(slug)

    if (!restaurant) {
        notFound()
    }

    const categories = await getCategories(restaurant.id)

    // Flatten all items for the AddOrderForm
    const allItems = categories.flatMap((c: any) => c.menu_items || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        is_available: i.is_available,
        item_type: i.item_type,
        options: i.options
    }))

    const orders = await getOrders(restaurant.id) as Order[]

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

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 border-b pb-4">
                <Link href={`/dashboard/restaurants/${slug}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight text-[#1F4E5F]">Orders</h2>
                    <p className="text-muted-foreground">Recent orders for {restaurant.name}</p>
                </div>
                <AddOrderForm restaurantId={restaurant.id} menuItems={allItems} />
            </div>

            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                        No orders yet.
                    </div>
                ) : (
                    orders.map((order) => (
                        <Card key={order.id} className="overflow-hidden border-2 hover:border-[#1F4E5F]/20 transition-colors">
                            <CardHeader className="bg-gray-50/50 pb-4 border-b">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm text-gray-500">#{order.id.slice(0, 8)}</span>
                                            <Badge variant="outline" className={`${getStatusColor(order.status)} uppercase text-xs font-semibold`}>
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
                                            <QuickStatusButton order={order} restaurantId={restaurant.id} />
                                            <EditOrderForm restaurantId={restaurant.id} order={order} menuItems={allItems} />
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
                                                    {item.selected_options && Array.isArray(item.selected_options) && item.selected_options.length > 0 && (
                                                        <div className="text-xs text-gray-500 space-y-0.5">
                                                            {item.selected_options.map((opt: any, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-1 pl-2 border-l-2 border-gray-200">
                                                                    <span>+ {opt.name}</span>
                                                                    {opt.choice_name && <span className="text-gray-400">({opt.choice_name})</span>}
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
                    ))
                )}
            </div>
        </div >
    )
}
