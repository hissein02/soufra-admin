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
import { Plus, Trash2, ShoppingCart, Check, ChevronsUpDown, UtensilsCrossed } from 'lucide-react'
import { createOrder } from '@/app/dashboard/actions'
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
import { MenuOptions, OptionGroup } from '@/types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface AddOrderFormProps {
    restaurantId: string
    menuItems: any[]
}

interface CartItem {
    id: string // temp id for cart
    menu_item_id: string
    name: string
    base_price: number
    price: number // calculated (base + options)
    quantity: number
    selected_options: any[] // We will store flattened option choices
}

export function AddOrderForm({ restaurantId, menuItems }: AddOrderFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [cart, setCart] = useState<CartItem[]>([])

    // Order Details
    const [tableNumber, setTableNumber] = useState('')
    const [orderType, setOrderType] = useState('dine_in')
    const [specialRequest, setSpecialRequest] = useState('')

    // Item Selection State
    const [selectedItemId, setSelectedItemId] = useState<string>('')
    const [itemOpen, setItemOpen] = useState(false)

    // Option Selection State for current item
    // Map of group_id -> choice_id (for single selection) or array (for multi, though only single supported now)
    const [currentSelections, setCurrentSelections] = useState<Record<string, string>>({})

    const availableItems = useMemo(() => {
        return menuItems.filter(item => item.is_available)
    }, [menuItems])

    const selectedMenuItem = useMemo(() => {
        return menuItems.find(i => i.id === selectedItemId)
    }, [selectedItemId, menuItems])

    // Reset selections when item changes
    useEffect(() => {
        setCurrentSelections({})
    }, [selectedItemId])

    // Calculate dynamic price based on selections
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

        // Validate required options
        const missingOptions = selectedMenuItem.options?.filter((group: OptionGroup) => {
            // If min_selection > 0, we must have a selection
            // For now assuming all radio groups are mandatory (min_selection: 1)
            // Or check if selection is missing
            return group.min_selection > 0 && !currentSelections[group.id]
        }) || []

        if (missingOptions.length > 0) {
            alert(`Please select options for: ${missingOptions.map((g: OptionGroup) => g.name).join(', ')}`)
            return
        }

        // Build selected_options array for db
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
                            price: choice.extra_price,
                            item_id: choice.item_id // Include item_id if this choice references another item
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

        // Don't reset item, just reset selections so they can add another variation easily?
        // Or reset everything. Resetting everything is safer.
        setSelectedItemId('')
        setCurrentSelections({})
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
        if (cart.length === 0) return

        setLoading(true)
        const orderData = {
            order_type: orderType,
            table_number: tableNumber,
            total_amount: totalAmount,
            special_request: specialRequest,
            items: cart
        }

        const result = await createOrder(restaurantId, orderData)

        if (result.success) {
            setOpen(false)
            setCart([])
            setTableNumber('')
            setOrderType('dine_in')
            setSpecialRequest('')
            setSelectedItemId('')
            setCurrentSelections({})
        } else {
            console.error(result.error)
            alert('Failed to create order')
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                    New Order
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[80vw] max-w-[95vw] w-full h-[90vh] flex flex-col p-6">
                <DialogHeader>
                    <DialogTitle>Create New Order</DialogTitle>
                    <DialogDescription>
                        Add items to the cart and submit the order.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-4 flex-1 overflow-hidden">
                    {/* Left: Input & Item Selection (Cols 1-7) */}
                    <div className="md:col-span-7 flex flex-col gap-6 overflow-y-auto pr-2">
                        {/* 1. Order Details Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Order Type</Label>
                                <Select value={orderType} onValueChange={setOrderType}>
                                    <SelectTrigger>
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
                                <div className="space-y-2">
                                    <Label>Table Number</Label>
                                    <Input
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Special Request */}
                        <div className="space-y-2">
                            <Label>Special Request / Note (Optional)</Label>
                            <Input
                                value={specialRequest}
                                onChange={(e) => setSpecialRequest(e.target.value)}
                            />
                        </div>

                        {/* 2. Item Search */}
                        <div className="space-y-2">
                            <Label className="text-base font-semibold text-[#1F4E5F]">Select Menu Item</Label>
                            <Popover open={itemOpen} onOpenChange={setItemOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={itemOpen}
                                        className="w-full justify-between h-12 text-lg"
                                    >
                                        {selectedItemId
                                            ? availableItems.find((item) => item.id === selectedItemId)?.name
                                            : "Search for starter, main, drink..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[600px] p-0" align="start">
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
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedItemId === item.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col w-full">
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium">{item.name}</span>
                                                                <span className="font-bold">{formatPrice(item.price)}</span>
                                                            </div>
                                                            {item.description && (
                                                                <span className="text-xs text-muted-foreground line-clamp-1">{item.description}</span>
                                                            )}
                                                            {item.item_type === 'set_menu' && (
                                                                <span className="text-xs text-blue-600 font-medium">✨ Menu Set</span>
                                                            )}
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* 3. Options Configuration (Conditional) */}
                        {selectedMenuItem && (
                            <div className="border rounded-lg p-6 bg-slate-50 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-start border-b pb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#1F4E5F]">{selectedMenuItem.name}</h3>
                                        <p className="text-muted-foreground">{selectedMenuItem.description}</p>
                                    </div>
                                    <div className="text-2xl font-bold text-[#E05D34]">
                                        {formatPrice(currentPrice)}
                                    </div>
                                </div>

                                {selectedMenuItem.options && selectedMenuItem.options.length > 0 ? (
                                    <div className="space-y-6">
                                        {selectedMenuItem.options.map((group: OptionGroup) => (
                                            <div key={group.id} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-base font-semibold">{group.name}</Label>
                                                    {group.min_selection > 0 && <span className="text-xs text-red-500 font-medium">(Required)</span>}
                                                </div>

                                                <RadioGroup
                                                    value={currentSelections[group.id]}
                                                    onValueChange={(val) => setCurrentSelections(prev => ({ ...prev, [group.id]: val }))}
                                                >
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {group.choices.map((choice) => (
                                                            <div key={choice.id} className={cn(
                                                                "flex items-center space-x-2 border rounded-md p-3 transition-colors cursor-pointer hover:bg-white",
                                                                currentSelections[group.id] === choice.id ? "bg-white border-[#1F4E5F] ring-1 ring-[#1F4E5F]" : "bg-transparent border-gray-200"
                                                            )}>
                                                                <RadioGroupItem value={choice.id} id={choice.id} />
                                                                <Label htmlFor={choice.id} className="flex-1 cursor-pointer flex justify-between items-center font-normal">
                                                                    <span>{choice.name}</span>
                                                                    {choice.extra_price > 0 && (
                                                                        <span className="text-xs font-medium text-[#E05D34]">+ {formatPrice(choice.extra_price)}</span>
                                                                    )}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 italic">No customizable options for this item.</div>
                                )}

                                <Button size="lg" className="w-full mt-4 text-lg" onClick={addToCart}>
                                    Add {selectedMenuItem.name} to Order
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Right: Cart Summary (Cols 8-12) */}
                    <div className="md:col-span-5 border-l pl-6 flex flex-col h-full bg-gray-50/50 rounded-r-lg -my-4 py-4 pr-2">
                        <div className="flex items-center gap-2 mb-6 text-[#1F4E5F] border-b pb-4">
                            <ShoppingCart className="h-6 w-6" />
                            <h3 className="text-xl font-bold">Current Order</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                                    <ShoppingCart className="h-12 w-12 opacity-20" />
                                    <p>Your cart is empty</p>
                                    <p className="text-xs">Add items from the menu to get started</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.id} className="bg-white p-4 rounded-lg border shadow-sm group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-[#1F4E5F]">{item.name}</div>
                                            <div className="font-bold text-[#E05D34]">{formatPrice(item.price * item.quantity)}</div>
                                        </div>

                                        {item.selected_options && item.selected_options.length > 0 && (
                                            <div className="text-xs text-gray-500 mb-3 space-y-1 bg-gray-50 p-2 rounded">
                                                {item.selected_options.map((opt: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between">
                                                        <span>• {opt.choice_name}</span>
                                                        {opt.price > 0 && <span>+{opt.price}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="text-xs text-gray-400 flex items-center">
                                                {formatPrice(item.price)} ea
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center border rounded-md bg-white">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none rounded-l-md hover:bg-gray-100" onClick={() => updateQuantity(item.id, -1)}>
                                                        -
                                                    </Button>
                                                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none rounded-r-md hover:bg-gray-100" onClick={() => updateQuantity(item.id, 1)}>
                                                        +
                                                    </Button>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full" onClick={() => removeFromCart(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-6 border-t mt-4 space-y-4 bg-white p-4 rounded-lg shadow-sm border">
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(totalAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax (0%)</span>
                                    <span>0 FCFA</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-2xl font-bold text-[#1F4E5F] pt-2 border-t">
                                <span>Total</span>
                                <span>{formatPrice(totalAmount)}</span>
                            </div>
                            <Button size="lg" className="w-full bg-[#E05D34] hover:bg-[#c64d26] h-12 text-lg shadow-lg shadow-orange-200" onClick={handleSubmit} disabled={loading || cart.length === 0}>
                                {loading ? 'Processing...' : 'Place Order'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
