import { notFound } from 'next/navigation'
import { getRestaurantBySlug } from '../../actions'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { UtensilsCrossed, ShoppingBag } from 'lucide-react'

export default async function RestaurantPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params
    const { slug } = params

    const restaurant = await getRestaurantBySlug(slug)

    if (!restaurant) {
        notFound()
    }

    return (
        <div className="space-y-8">
            <div className="border-b pb-4">
                <h2 className="text-3xl font-bold tracking-tight text-[#1F4E5F]">{restaurant.name}</h2>
                <p className="text-muted-foreground">{restaurant.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href={`/dashboard/restaurants/${slug}/menu`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 hover:border-[#E05D34]/50">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <UtensilsCrossed className="h-8 w-8 text-[#E05D34]" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-[#1F4E5F]">Menu Management</CardTitle>
                                <CardDescription>Add items, categories, and manage pricing</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href={`/dashboard/restaurants/${slug}/orders`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 hover:border-[#1F4E5F]/50">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <ShoppingBag className="h-8 w-8 text-[#1F4E5F]" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-[#1F4E5F]">Orders</CardTitle>
                                <CardDescription>View and manage customer orders</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
