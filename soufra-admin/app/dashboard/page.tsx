
import { Suspense } from 'react'
import { getRestaurants } from './actions'
import { RestaurantCard } from '@/components/restaurant-card'
import { AddRestaurantForm } from '@/components/forms/add-restaurant-form'

export default async function DashboardPage() {
    const restaurants = await getRestaurants()

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#1F4E5F]">Dashboard</h2>
                    <p className="text-muted-foreground">Manage your restaurants and menus.</p>
                </div>
                <AddRestaurantForm />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((restaurant) => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
                {restaurants.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                        No restaurants found. Add one to get started.
                    </div>
                )}
            </div>
        </div>
    )
}
