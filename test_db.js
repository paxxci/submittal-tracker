const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  // Query for all foreign keys referencing auth.users or public.profiles
  const { data, error } = await supabase.rpc('execute_sql_query', { query: `
    SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name IN ('users', 'profiles', 'organizations');
  `})
  
  if (error) {
    console.log("RPC failed, trying raw query...", error.message)
    // Supabase JS doesn't support raw SQL directly without RPC.
    // Let's just use REST API to query `information_schema.table_constraints`? No, REST API only exposes `public` schema.
  }
}
run()
