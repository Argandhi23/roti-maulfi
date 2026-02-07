import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Kita gunakan createBrowserClient agar session login tersimpan otomatis di browser
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)