'use client';

/**
 * AuthContext — autenticación 100 % en memoria (RAM), sin persistencia.
 *
 * Garantías de seguridad:
 *  1. En cada montaje inicial se borra localStorage + sessionStorage completos
 *     y se revoca cualquier token residual en Supabase.
 *  2. isAuthenticated nunca se restaura desde storage — siempre arranca en false.
 *  3. El timer de inactividad (30 min) cierra la sesión de forma irrevocable
 *     aunque el usuario intente detenerlo.
 *  4. window.location.replace('/') expulsa al usuario sin dejar historial
 *     al que pueda volver con el botón Atrás.
 *
 * Patrón "flag-antes-de-limpiar":
 *  Antes del replace, se escribe la clave '__exp' en sessionStorage.
 *  Al montar, se lee esa clave PRIMERO y luego se limpia todo el storage.
 *  Así el banner de "sesión expirada" puede mostrarse tras la redirección.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabaseClient';

const INACTIVITY_MS  = 30 * 60 * 1_000; // 30 minutos
const EXP_FLAG_KEY   = '__exp';          // clave sessionStorage para el banner

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** true solo mientras el usuario tiene sesión activa en esta carga de página */
  isAuthenticated: boolean;
  isLoginOpen: boolean;
  /** true si la última sesión fue cerrada por inactividad */
  sessionExpiredByInactivity: boolean;
  openLogin:        () => void;
  closeLogin:       () => void;
  clearExpiryAlert: () => void;
  login:  (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {

  // Lee el flag de expiración ANTES de limpiar storage (lazy initializer,
  // solo en cliente — durante SSR window no existe).
  const [sessionExpiredByInactivity, setSessionExpired] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(EXP_FLAG_KEY) === '1';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false); // SIEMPRE false al arrancar
  const [isLoginOpen,     setIsLoginOpen]     = useState(false);

  // ── Limpieza agresiva en el primer montaje ─────────────────────────────────
  useEffect(() => {
    // Borra TODA evidencia de sesiones previas (tokens de Supabase, cookies
    // generadas por versiones antiguas con persistSession:true, etc.)
    sessionStorage.clear();
    localStorage.clear();

    // Revoca en el servidor cualquier token que pudiera seguir activo.
    // Fire-and-forget: no hay sesión válida en este punto de todas formas.
    void supabase.auth.signOut();
  }, []); // ← se ejecuta una sola vez al montar el árbol de la app

  // ── Timer de inactividad (activo SOLO cuando isAuthenticated === true) ─────
  //
  // expireRef: evita closures obsoletos sin forzar re-runs del efecto.
  // Actualizar la ref en cada render es seguro y gratuito.
  const expireRef = useRef<() => void>(() => {});
  expireRef.current = () => {
    // 1. Escribir el flag ANTES de limpiar (el replace recarga la página)
    try { sessionStorage.setItem(EXP_FLAG_KEY, '1'); } catch { /* noop */ }

    // 2. Borrar estado React
    setIsAuthenticated(false);

    // 3. Revocar token en Supabase (fire-and-forget)
    void supabase.auth.signOut();

    // 4. Expulsar al usuario sin dejar historia de navegación
    window.location.replace('/');
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Crear timer inicial
    let timer = setTimeout(() => expireRef.current(), INACTIVITY_MS);

    // Cualquier interacción del usuario reinicia el contador desde cero
    function resetTimer() {
      clearTimeout(timer);
      timer = setTimeout(() => expireRef.current(), INACTIVITY_MS);
    }

    const EVENTS = ['mousemove', 'keydown', 'click', 'scroll'] as const;
    EVENTS.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    // Limpieza: al desautenticarse, el efecto se desmonta y cancela todo
    return () => {
      clearTimeout(timer);
      EVENTS.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isAuthenticated]);

  // ── Acciones públicas ──────────────────────────────────────────────────────

  const openLogin = useCallback(() => {
    setSessionExpired(false); // abrir el modal descarta el banner
    setIsLoginOpen(true);
  }, []);

  const closeLogin       = useCallback(() => setIsLoginOpen(false),    []);
  const clearExpiryAlert = useCallback(() => setSessionExpired(false), []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
          return { error: 'Correo o contraseña incorrectos. Verifica tus credenciales.' };
        }
        if (msg.includes('email not confirmed')) {
          return { error: 'Debes confirmar tu correo electrónico antes de ingresar.' };
        }
        if (msg.includes('too many requests')) {
          return { error: 'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.' };
        }
        return { error: error.message };
      }

      // Credenciales válidas → sesión solo en RAM
      setIsAuthenticated(true);
      setIsLoginOpen(false);
      return { error: null };
    },
    []
  );

  const logout = useCallback(async () => {
    setIsAuthenticated(false);
    sessionStorage.clear();
    localStorage.clear();
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoginOpen,
        sessionExpiredByInactivity,
        openLogin,
        closeLogin,
        clearExpiryAlert,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
