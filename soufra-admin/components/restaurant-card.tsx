
import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { EditRestaurantForm } from './forms/edit-restaurant-form'

interface Restaurant {
    id: string
    name: string
    description: string
    phone_number: string
    slug: string
}

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow group relative">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <EditRestaurantForm restaurant={restaurant} />
            </div>
            <CardHeader>
                <CardTitle className="text-xl text-[#1F4E5F] pr-8">{restaurant.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
                <p className="text-sm text-gray-500 line-clamp-3">{restaurant.description || 'No description provided.'}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
                    <Phone className="h-4 w-4" />
                    <span>{restaurant.phone_number || 'N/A'}</span>
                </div>
            </CardContent>
            <CardFooter className="pt-4 border-t bg-gray-50/50">
                <Button asChild className="w-full bg-[#1F4E5F] hover:bg-[#163C4A]">
                    <Link href={`/dashboard/restaurants/${restaurant.slug}`}>
                        Manage Restaurant <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
