import { notFound } from 'next/navigation'
import { getRestaurantBySlug, getOrders, getCategories } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Order } from '@/types'
import { AddOrderForm } from '@/components/forms/add-order-form'
import { OrdersList } from '@/components/orders/orders-list'

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

            <OrdersList
                initialOrders={orders}
                restaurantId={restaurant.id}
                allItems={allItems}
            />
        </div >
    )
}

