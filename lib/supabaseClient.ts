import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase para uso en componentes cliente ('use client').
 * Lee las variables de entorno públicas definidas en .env.local.
 *
 * La sesión se persiste automáticamente en localStorage del navegador,
 * sobreviviendo recargas y cambios de pestaña.
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

export const supabase = createClient(supabaseUrl, supabaseKey);
