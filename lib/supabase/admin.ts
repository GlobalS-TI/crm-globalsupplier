import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

// Cliente con service_role: bypasea RLS. Solo usar en server-side (Server Actions, Route Handlers).
// NUNCA importar desde Client Components.
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
