'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getRestaurants() {
    const supabase = await createClient()
    const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching restaurants:', error)
        return []
    }

    return restaurants
}

export async function createRestaurant(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const phone_number = formData.get('phone_number') as string
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const { error } = await supabase
        .from('restaurants')
        .insert({
            name,
            description,
            phone_number,
            slug,
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function getRestaurant(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return null
    return data
}

export async function getRestaurantBySlug(slug: string) {
    const supabase = await createClient()
    console.log('Fetching restaurant with slug:', slug)
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error) {
        console.error('Error fetching restaurant by slug:', error)
        return null
    }
    console.log('Found restaurant:', data)
    return data
}

export async function getMenuItem(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return null
    return data
}

export async function getCategories(restaurantId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('categories')
        .select(`
      *,
      menu_items (*)
    `)
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true })

    if (error) return []
    return data
}

export async function createCategory(restaurantId: string, formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const sort_order = parseInt(formData.get('sort_order') as string) || 0

    const { error } = await supabase
        .from('categories')
        .insert({
            restaurant_id: restaurantId,
            name,
            sort_order,
        })

    if (error) {
        console.error('Error creating category:', error)
        return { error: error.message }
    }

    revalidatePath(`/dashboard/restaurants/${restaurantId}`)
    return { success: true }
}

export async function createMenuItem(restaurantId: string, categoryId: string, formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const image_url = formData.get('image_url') as string

    const item_type = (formData.get('item_type') as string) || 'single'
    const optionsJson = formData.get('options') as string
    const options = optionsJson ? JSON.parse(optionsJson) : []

    const { error } = await supabase
        .from('menu_items')
        .insert({
            restaurant_id: restaurantId,
            category_id: categoryId,
            name,
            description,
            price,
            image_url: image_url || null,
            is_available: formData.get('is_available') === 'on',
            item_type,
            options
        })

    if (error) return { error: error.message }
    revalidatePath(`/dashboard/restaurants/${restaurantId}`)
    // Also revalidate the slug path just in case
    // We can't easily guess the slug here without querying, but revalidating the ID path is usually enough for data
    // If we need slug revalidation, we might need to fetch the restaurant first or pass the slug.
    return { success: true }
}

export async function updateRestaurant(id: string, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const phone_number = formData.get('phone_number') as string

    // Only update fields that are present
    const updates: any = {
        name,
        description,
        phone_number,
    }

    const { error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/restaurants/${id}`)
    return { success: true }
}

export async function updateCategory(restaurantId: string, categoryId: string, formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const sort_order = parseInt(formData.get('sort_order') as string) || 0

    const { error } = await supabase
        .from('categories')
        .update({ name, sort_order })
        .eq('id', categoryId)

    if (error) {
        console.error('Error updating category:', error)
        return { error: error.message }
    }

    revalidatePath(`/dashboard/restaurants/${restaurantId}`)
    return { success: true }
}

export async function updateMenuItem(restaurantId: string, itemId: string, formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const image_url = formData.get('image_url') as string
    const is_available = formData.get('is_available') === 'on'

    const item_type = (formData.get('item_type') as string) || 'single'
    const optionsJson = formData.get('options') as string
    const options = optionsJson ? JSON.parse(optionsJson) : []

    const { error } = await supabase
        .from('menu_items')
        .update({
            name,
            description,
            price,
            image_url: image_url || null,
            is_available,
            item_type,
            options
        })
        .eq('id', itemId)

    if (error) return { error: error.message }
    revalidatePath(`/dashboard/restaurants/${restaurantId}`)
    return { success: true }
}

export async function toggleMenuItemAvailability(restaurantId: string, itemId: string, isAvailable: boolean) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('menu_items')
        .update({ is_available: isAvailable })
        .eq('id', itemId)

    if (error) return { error: error.message }
    revalidatePath(`/dashboard/restaurants/${restaurantId}`)
    return { success: true }
}

export async function getOrders(restaurantId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (*)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching orders:', error)
        return []
    }
    return data
}

export async function createOrder(restaurantId: string, orderData: any) {
    const supabase = await createClient()

    // 1. Create the order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            restaurant_id: restaurantId,
            order_type: orderData.order_type,
            status: 'pending',
            table_number: orderData.table_number || null,
            total_amount: orderData.total_amount
        })
        .select()
        .single()

    if (orderError) {
        console.error('Error creating order:', orderError)
        return { error: orderError.message }
    }

    // 2. Create order items
    const itemsToInsert = orderData.items.map((item: any) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        price_at_time: item.price,
        selected_options: item.selected_options || []
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert)

    if (itemsError) {
        console.error('Error creating order items:', itemsError)
        // ideally we would rollback here, but Supabase HTTP api doesnt support simple transactions like this easily without rpc
        // for now we will just log it. In production use an RPC call for atomic transaction.
        return { error: itemsError.message }
    }

    revalidatePath(`/dashboard/restaurants/${restaurantId}`)
    return { success: true }
}

export async function updateOrder(restaurantId: string, orderId: string, data: any) {
    const supabase = await createClient()

    // 1. Update Order Details (Status, Total, Table, Type)
    const { error: orderError } = await supabase
        .from('orders')
        .update({
            status: data.status,
            order_type: data.order_type,
            table_number: data.table_number,
            total_amount: data.total_amount
        })
        .eq('id', orderId)

    if (orderError) {
        console.error('Error updating order:', orderError)
        return { error: 'Failed to update order details' }
    }

    // 2. Update Items (Strategy: Delete all and recreate)
    if (data.items) {
        // Delete existing items
        const { error: deleteError } = await supabase
            .from('order_items')
            .delete()
            .eq('order_id', orderId)

        if (deleteError) {
            console.error('Error deleting old items:', deleteError)
            return { error: 'Failed to update order items' }
        }

        // Insert new items
        const itemsToInsert = data.items.map((item: any) => ({
            order_id: orderId,
            menu_item_id: item.menu_item_id,
            name: item.name,
            quantity: item.quantity,
            price_at_time: item.price,
            selected_options: item.selected_options || []
        }))

        const { error: insertError } = await supabase
            .from('order_items')
            .insert(itemsToInsert)

        if (insertError) {
            console.error('Error inserting new items:', insertError)
            return { error: 'Failed to save new order items' }
        }
    }

    revalidatePath(`/dashboard/restaurants/${restaurantId}`)
    return { success: true }
}
