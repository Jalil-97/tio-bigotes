import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si faltan las variables, no creamos el cliente (createClient tiraría una
// excepción al importar el módulo y la app quedaría en blanco). Exportamos el
// error para que la UI lo muestre de forma legible.
export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. Copiá .env.example a .env y completalas.'
    : null

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey)
