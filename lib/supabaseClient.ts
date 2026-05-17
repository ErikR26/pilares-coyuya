import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase para uso en componentes cliente ('use client').
 * Lee las variables de entorno públicas definidas en .env.local.
 *
 * Seguridad de sesión:
 *   • Usa sessionStorage en lugar de localStorage: la sesión muere al cerrar
 *     la pestaña o el navegador, exigiendo re-autenticación en cada visita.
 *   • El timer de inactividad (AuthContext) cierra la sesión tras 30 min sin
 *     actividad del usuario.
 *
 * Para componentes de servidor (SSR/RSC) usar @supabase/ssr en su lugar.
 */
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://placeholder.supabase.co';
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key';

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
    // sessionStorage: la sesión expira al cerrar la pestaña/navegador.
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
