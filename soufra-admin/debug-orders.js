
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// Using anon key might be issue if RLS prevents read. 
// But actions.ts uses createClient from lib which uses cookies or service role?
// Actually actions.ts uses `createClient` from `@/lib/supabase/server`.
// I can't simulate server auth easily here.
// I'll try to use the SERVICE_ROLE_KEY if available in env, or just ANON.

async function checkData() {
    console.log('Checking orders...')
    const sb = createClient(supabaseUrl, supabaseKey)

    // 1. Check orders
    const { data: orders, error } = await sb
        .from('orders')
        .select('*, order_items(*)')
        .limit(5)

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Orders found:', orders.length)
        if (orders.length > 0) {
            console.log('First order items:', JSON.stringify(orders[0].order_items, null, 2))
        }
    }
}

checkData()
