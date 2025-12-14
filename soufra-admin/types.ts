export type OptionChoice = {
    id: string;            // A random string ID
    name: string;          // Display name
    item_id?: string;      // Optional: link to another menu_item.id
    extra_price: number;   // 0 for included, >0 for extra cost
    is_available: boolean; // toggle to hide a specific choice temporarily
};

export type OptionGroup = {
    id: string;
    name: string;          // e.g., "Starters", "Sauces"
    min_selection: number; // e.g., 1 (Required)
    max_selection: number; // e.g., 1 (Single Pick)
    choices: OptionChoice[];
};

// The structure stored in the database
export type MenuOptions = OptionGroup[];

export interface OrderItem {
    id: string
    order_id: string
    menu_item_id?: string
    name: string
    quantity: number
    price_at_time: number
    selected_options?: any
    steps?: string
}

export interface Order {
    id: string
    restaurant_id: string
    user_id?: string
    order_type: 'dine_in' | 'take_away' | 'delivery'
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'out_for_delivery' | 'delivered' | 'cancelled'
    table_number?: string
    total_amount: number
    created_at: string
    updated_at: string
    special_request?: string
    order_items?: OrderItem[]
}
