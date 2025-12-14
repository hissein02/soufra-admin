import { formatPrice } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { getRestaurantBySlug, getCategories } from '@/app/dashboard/actions'
import { AddCategoryForm } from '@/components/forms/add-category-form'
import { AddItemForm } from '@/components/forms/add-item-form'
import { EditCategoryForm } from '@/components/forms/edit-category-form'
import { EditItemForm } from '@/components/forms/edit-item-form'
import { ItemAvailabilityToggle } from '@/components/item-availability-toggle'
import { DeleteMenuItemButton } from '@/components/delete-menu-item-button'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function MenuPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params
    const { slug } = params

    const restaurant = await getRestaurantBySlug(slug)

    if (!restaurant) {
        notFound()
    }

    const categories = await getCategories(restaurant.id)

    // Flatten all items for the "Link Existing Item" feature
    const allItems = categories.flatMap((c: any) => c.menu_items || []).map((i: any) => ({
        id: i.id,
        name: i.name
    }))

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 border-b pb-4">
                <Link href={`/dashboard/restaurants/${slug}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight text-[#1F4E5F]">Menu Management</h2>
                    <p className="text-muted-foreground">Manage categories and items for {restaurant.name}</p>
                </div>
                <AddCategoryForm restaurantId={restaurant.id} />
            </div>

            <div className="space-y-6">
                {categories.map((category: any) => (
                    <div key={category.id} className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-semibold text-[#1F4E5F]">{category.name}</h3>
                                <EditCategoryForm restaurantId={restaurant.id} category={category} />
                            </div>
                            <AddItemForm restaurantId={restaurant.id} categoryId={category.id} existingItems={allItems} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {category.menu_items?.map((item: any) => (
                                <Card
                                    key={item.id}
                                    className={`overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow group relative ${item.is_available ? 'bg-green-50/50 border-green-300' : 'bg-red-50/50 border-red-300'
                                        }`}
                                >
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                                        <EditItemForm restaurantId={restaurant.id} item={item} existingItems={allItems} />
                                        <DeleteMenuItemButton
                                            restaurantId={restaurant.id}
                                            itemId={item.id}
                                            itemName={item.name}
                                        />
                                    </div>
                                    {item.image_url && (
                                        <div className="h-32 w-full relative bg-gray-100 flex items-center justify-center">
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <h4 className="font-semibold text-lg leading-none">{item.name}</h4>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <span className="font-bold text-lg text-[#E05D34]">
                                                {formatPrice(item.price)}
                                            </span>
                                            <ItemAvailabilityToggle
                                                restaurantId={restaurant.id}
                                                itemId={item.id}
                                                isAvailable={item.is_available}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {(!category.menu_items || category.menu_items.length === 0) && (
                                <div className="col-span-full py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                    No items in this category yet.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {categories.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No categories found. Add a category to start building the menu.
                    </div>
                )}
            </div>
        </div>
    )
}
