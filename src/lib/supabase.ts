import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !key) {
  console.warn('Faltan las variables de entorno de Supabase. La app va a funcionar en modo local.')
}

export const supabase = createClient(url || '', key || '', {
  auth: { persistSession: false },
})
