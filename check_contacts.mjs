import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './frontend/.env' })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
  console.log("URL:", process.env.VITE_SUPABASE_URL)
  
  // Try inserting without organization_id but with a dummy org_id to see if it exists
  const { data, error } = await supabase.from('contacts').select('organization_id').limit(1)
  console.log("Contacts select error:", error?.message || "No error (column exists!)")
  console.log("Contacts select data:", data)
}
check()
