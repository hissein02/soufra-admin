'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, ShoppingCart, Check, ChevronsUpDown, Edit2, Save, X } from 'lucide-react'
import { updateOrder } from '@/app/dashboard/actions'
import { formatPrice } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { MenuOptions, OptionGroup, Order } from '@/types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'

interface EditOrderFormProps {
    restaurantId: string
    order: Order
    menuItems: any[]
}

interface CartItem {
    id: string
    menu_item_id: string
    name: string
    base_price: number
    price: number
    quantity: number
    selected_options: any[]
}

export function EditOrderForm({ restaurantId, order, menuItems }: EditOrderFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [cart, setCart] = useState<CartItem[]>([])

    // Order Details
    const [tableNumber, setTableNumber] = useState(order.table_number || '')
    const [orderType, setOrderType] = useState(order.order_type)
    const [status, setStatus] = useState(order.status)

    // Adding Item State
    const [isAddingItem, setIsAddingItem] = useState(false)
    const [selectedItemId, setSelectedItemId] = useState<string>('')
    const [itemOpen, setItemOpen] = useState(false)
    const [currentSelections, setCurrentSelections] = useState<Record<string, string>>({})

    const availableItems = useMemo(() => {
        return menuItems.filter(item => item.is_available)
    }, [menuItems])

    const selectedMenuItem = useMemo(() => {
        return menuItems.find(i => i.id === selectedItemId)
    }, [selectedItemId, menuItems])

    // Load initial data
    useEffect(() => {
        if (!open) return

        const loadItems = async () => {
            // 1. Try to use passed items first
            if (order.order_items && order.order_items.length > 0) {
                const initialCart = mapItemsToCart(order.order_items, menuItems)
                setCart(initialCart)
            } else {
                // 2. Fallback: Fetch items client-side (helps debug RLS too)
                try {
                    const { createClient } = await import('@/lib/supabase/client')
                    const supabase = createClient()
                    const { data, error } = await supabase
                        .from('order_items')
                        .select('*')
                        .eq('order_id', order.id)

                    if (error) {
                        console.error("Error fetching order items:", error)
                        alert(`Error fetching items: ${error.message} (Hint: Check RLS policies)`)
                        return
                    }

                    if (data) {
                        const initialCart = mapItemsToCart(data, menuItems)
                        setCart(initialCart)
                    }
                } catch (err) {
                    console.error("Failed to load items:", err)
                }
            }

            // Set other fields
            setStatus(order.status)
            setOrderType(order.order_type)
            setTableNumber(order.table_number || '')
            setIsAddingItem(false)
            setSelectedItemId('')
            setCurrentSelections({})
        }

        loadItems()
    }, [open, order, menuItems])

    // Helper to map DB items to Cart format
    const mapItemsToCart = (items: any[], menuItems: any[]) => {
        return items.map(item => {
            const originalItem = menuItems.find(i => i.id === item.menu_item_id)
            return {
                id: crypto.randomUUID(),
                menu_item_id: item.menu_item_id || '',
                name: item.name,
                base_price: originalItem ? originalItem.price : item.price_at_time,
                price: item.price_at_time,
                quantity: item.quantity,
                selected_options: item.selected_options || []
            }
        })
    }

    useEffect(() => {
        setCurrentSelections({})
    }, [selectedItemId])

    const currentPrice = useMemo(() => {
        if (!selectedMenuItem) return 0
        let price = selectedMenuItem.price

        if (selectedMenuItem.options) {
            selectedMenuItem.options.forEach((group: OptionGroup) => {
                const choiceId = currentSelections[group.id]
                if (choiceId) {
                    const choice = group.choices.find(c => c.id === choiceId)
                    if (choice) price += (choice.extra_price || 0)
                }
            })
        }
        return price
    }, [selectedMenuItem, currentSelections])


    const addToCart = () => {
        if (!selectedMenuItem) return

        const missingOptions = selectedMenuItem.options?.filter((group: OptionGroup) => {
            return group.min_selection > 0 && !currentSelections[group.id]
        }) || []

        if (missingOptions.length > 0) {
            alert(`Please select options for: ${missingOptions.map((g: OptionGroup) => g.name).join(', ')}`)
            return
        }

        const selectedOptionsList: any[] = []
        if (selectedMenuItem.options) {
            selectedMenuItem.options.forEach((group: OptionGroup) => {
                const choiceId = currentSelections[group.id]
                if (choiceId) {
                    const choice = group.choices.find(c => c.id === choiceId)
                    if (choice) {
                        selectedOptionsList.push({
                            group_name: group.name,
                            name: choice.name,
                            choice_name: choice.name,
                            price: choice.extra_price
                        })
                    }
                }
            })
        }

        const newItem: CartItem = {
            id: crypto.randomUUID(),
            menu_item_id: selectedMenuItem.id,
            name: selectedMenuItem.name,
            base_price: selectedMenuItem.price,
            price: currentPrice,
            quantity: 1,
            selected_options: selectedOptionsList
        }

        setCart([...cart, newItem])
        setSelectedItemId('')
        setCurrentSelections({})
        setIsAddingItem(false) // Close add mode after adding
    }

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id))
    }

    const updateQuantity = (id: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQuantity = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQuantity }
            }
            return item
        }))
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    async function handleSubmit() {
        if (cart.length === 0 && status !== 'cancelled') return

        setLoading(true)
        const orderData = {
            order_type: orderType,
            status: status,
            table_number: tableNumber,
            total_amount: totalAmount,
            items: cart
        }

        const result = await updateOrder(restaurantId, order.id, orderData)

        if (result.success) {
            setOpen(false)
        } else {
            console.error(result.error)
            alert('Failed to update order')
        }
        setLoading(false)
    }

    // Status Options
    const statusOptions = [
        { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
        { value: 'preparing', label: 'Preparing', color: 'bg-indigo-100 text-indigo-800' },
        { value: 'ready', label: 'Ready', color: 'bg-green-100 text-green-800' },
        { value: 'served', label: 'Served', color: 'bg-gray-100 text-gray-800' },
        { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
        { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-orange-100 text-orange-800' },
        { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
        { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    ]

    const filteredStatusOptions = useMemo(() => {
        const allowedStatuses = {
            'dine_in': ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'],
            'take_away': ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
            'delivery': ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
        }

        // Default to all if orderType is unknown or not set yet
        const allowed = allowedStatuses[orderType as keyof typeof allowedStatuses] || statusOptions.map(s => s.value)

        return statusOptions.filter(opt => allowed.includes(opt.value))
    }, [orderType])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] flex flex-col bg-gray-50 p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 bg-white border-b shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl text-[#1F4E5F]">Edit Order #{order.id.slice(0, 8)}</DialogTitle>
                            <DialogDescription>
                                Manage items and status
                            </DialogDescription>
                        </div>
                        <Badge variant="secondary" className="text-xl px-4 py-1.5 font-mono bg-[#E05D34]/10 text-[#E05D34] border-[#E05D34]/20">
                            {formatPrice(totalAmount)}
                        </Badge>
                    </div>

                    {/* Status Bar */}
                    <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg border">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</Label>
                            <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                                <SelectTrigger className="bg-white h-8 text-sm border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredStatusOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <div className="flex items-center gap-2">
                                                <span className={cn("w-2 h-2 rounded-full", opt.color.replace('text-', 'bg-').split(' ')[0])} />
                                                {opt.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</Label>
                            <Select value={orderType} onValueChange={(val: any) => setOrderType(val)}>
                                <SelectTrigger className="bg-white h-8 text-sm border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dine_in">Dine In</SelectItem>
                                    <SelectItem value="take_away">Take Away</SelectItem>
                                    <SelectItem value="delivery">Delivery</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {orderType === 'dine_in' && (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Table</Label>
                                <Input
                                    className="bg-white h-8 text-sm border-gray-200"
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    placeholder="#"
                                />
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
                    {/* Item List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Order Items ({cart.length})</h3>
                        </div>

                        {cart.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50/50">
                                <ShoppingCart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No items in this order</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-[#1F4E5F]/30 hover:shadow-md group">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 text-base">{item.name}</span>
                                                </div>
                                                {item.selected_options && item.selected_options.length > 0 && (
                                                    <div className="text-sm text-gray-500 mt-1.5 space-y-1">
                                                        {item.selected_options.map((opt: any, idx) => (
                                                            <div key={idx} className="flex items-center gap-1.5">
                                                                <Check className="w-3 h-3 text-[#E05D34]" />
                                                                <span>{opt.choice_name || opt.name}</span>
                                                                {opt.price > 0 && <span className="text-gray-400">({formatPrice(opt.price)})</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-900 text-lg">{formatPrice(item.price * item.quantity)}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{formatPrice(item.price)} each</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-50">
                                            <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm text-gray-500"
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                >
                                                    -
                                                </Button>
                                                <span className="w-10 text-center text-sm font-semibold text-gray-700">{item.quantity}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm text-gray-500"
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                >
                                                    +
                                                </Button>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-3"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1.5" />
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add Item Section */}
                    <div className="space-y-4">
                        {!isAddingItem ? (
                            <Button
                                variant="outline"
                                className="w-full border-dashed border-2 py-8 text-gray-400 hover:text-[#1F4E5F] hover:border-[#1F4E5F]/50 hover:bg-[#1F4E5F]/5 transition-all text-base font-medium rounded-xl"
                                onClick={() => setIsAddingItem(true)}
                            >
                                <Plus className="h-5 w-5 mr-2" /> Add Item to Order
                            </Button>
                        ) : (
                            <div className="bg-white p-5 rounded-xl border border-[#1F4E5F]/20 shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200 space-y-5 ring-4 ring-[#1F4E5F]/5">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <h4 className="font-semibold text-[#1F4E5F] flex items-center gap-2">
                                        <Plus className="h-4 w-4" /> Add New Item
                                    </h4>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full hover:bg-gray-100" onClick={() => {
                                        setIsAddingItem(false)
                                        setSelectedItemId('')
                                        setCurrentSelections({})
                                    }}>
                                        <X className="h-4 w-4 text-gray-500" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Select Item</Label>
                                        <Popover open={itemOpen} onOpenChange={setItemOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={itemOpen}
                                                    className="w-full justify-between h-11 bg-gray-50/50 border-gray-300"
                                                >
                                                    {selectedItemId
                                                        ? availableItems.find((item) => item.id === selectedItemId)?.name
                                                        : "Search menu..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search menu..." />
                                                    <CommandList>
                                                        <CommandEmpty>No item found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {availableItems.map((item) => (
                                                                <CommandItem
                                                                    key={item.id}
                                                                    value={item.name}
                                                                    onSelect={() => {
                                                                        setSelectedItemId(item.id === selectedItemId ? "" : item.id)
                                                                        setItemOpen(false)
                                                                    }}
                                                                >
                                                                    <div className="flex justify-between w-full">
                                                                        <span>{item.name}</span>
                                                                        <span className="font-bold">{formatPrice(item.price)}</span>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {selectedMenuItem && (
                                        <div className="pt-4 space-y-5 border-t border-dashed">
                                            <div className="flex justify-between items-center text-[#1F4E5F]">
                                                <span className="font-bold text-lg">{selectedMenuItem.name}</span>
                                                <Badge variant="outline" className="text-base font-bold bg-[#E05D34]/10 text-[#E05D34] border-0">
                                                    {formatPrice(currentPrice)}
                                                </Badge>
                                            </div>

                                            {selectedMenuItem.options && selectedMenuItem.options.length > 0 && (
                                                <div className="grid gap-5">
                                                    {selectedMenuItem.options.map((group: OptionGroup) => (
                                                        <div key={group.id} className="space-y-2.5">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-sm font-semibold text-gray-700">{group.name}</Label>
                                                                {group.min_selection > 0 && <span className="text-[10px] text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full">REQUIRED</span>}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {group.choices.map((choice) => (
                                                                    <div
                                                                        key={choice.id}
                                                                        className={cn(
                                                                            "text-sm border rounded-lg px-3 py-2 cursor-pointer transition-all hover:bg-white hover:border-[#1F4E5F]/30",
                                                                            currentSelections[group.id] === choice.id
                                                                                ? "bg-[#1F4E5F]/5 border-[#1F4E5F] text-[#1F4E5F] font-medium shadow-sm"
                                                                                : "bg-white border-gray-200 text-gray-600"
                                                                        )}
                                                                        onClick={() => setCurrentSelections(prev => ({ ...prev, [group.id]: choice.id }))}
                                                                    >
                                                                        <div className="flex justify-between items-center">
                                                                            <span>{choice.name}</span>
                                                                            {choice.extra_price > 0 && <span className="text-xs font-semibold text-[#E05D34]">+{formatPrice(choice.extra_price)}</span>}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <Button
                                                className="w-full bg-[#E05D34] hover:bg-[#c64d26] h-12 text-lg shadow-md transition-all hover:shadow-lg"
                                                onClick={addToCart}
                                            >
                                                <Plus className="h-5 w-5 mr-2" />
                                                Add Item
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 bg-white border-t shrink-0">
                    <div className="flex gap-3 w-full">
                        <Button variant="outline" size="lg" className="flex-1 h-12" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={loading} size="lg" className="flex-[2] bg-[#1F4E5F] hover:bg-[#163a4a] h-12 text-lg font-semibold shadow-md">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
