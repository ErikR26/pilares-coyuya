import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase con persistencia de sesión completamente desactivada.
 *
 * persistSession: false  — el SDK nunca escribe tokens en localStorage ni
 *                          sessionStorage. La sesión vive solo en RAM.
 * autoRefreshToken: false — no hay renovaciones silenciosas en segundo plano.
 * detectSessionInUrl: false — no intenta leer tokens de la URL (#access_token).
 *
 * Consecuencia deseada: cualquier recarga, F5 o cierre de pestaña destruye
 * la sesión completamente. El único camino para autenticarse es el truco
 * de los 3 clics → formulario de credenciales → éxito en runtime.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key';

if (
  process.env.NODE_ENV !== 'test' &&
  (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
) {
  console.warn(
    '[supabaseClient] Variables de entorno no configuradas. ' +
    'Copia .env.example → .env.local y rellena tus credenciales de Supabase.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession:    false,
    autoRefreshToken:  false,
    detectSessionInUrl: false,
  },
});
