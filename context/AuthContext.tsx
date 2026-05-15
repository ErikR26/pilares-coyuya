'use client';

/**
 * AuthContext — autenticación real con Supabase Auth.
 *
 * La sesión se persiste automáticamente en localStorage del navegador:
 *   • Sobrevive recargas de página.
 *   • Sobrevive cambios de pestaña.
 *   • Expira según el TTL configurado en Supabase (por defecto 1 hora,
 *     con renovación automática si el usuario está activo).
 *
 * Flujo de inicialización:
 *   1. getSession() → restaura sesión existente desde localStorage.
 *   2. onAuthStateChange() → mantiene el estado sincronizado con cualquier
 *      evento de Supabase (login, logout, token refresh, etc.).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextValue {
  isAuthenticated: boolean;
  /** true mientras se verifica la sesión inicial (evita flash de "no autenticado") */
  isAuthLoading: boolean;
  isLoginOpen: boolean;
  openLogin:  () => void;
  closeLogin: () => void;
  login:  (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading,   setIsAuthLoading]   = useState(true);
  const [isLoginOpen,     setIsLoginOpen]      = useState(false);

  // ── Inicialización y escucha de cambios de sesión ──────────────────────────
  useEffect(() => {
    // 1. Restaura la sesión guardada en localStorage (si existe)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsAuthLoading(false);
    });

    // 2. Escucha cualquier evento de autenticación posterior
    //    (login, logout, token_refreshed, user_updated, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
        setIsAuthLoading(false);
      }
    );

    // Limpia la suscripción al desmontar el provider
    return () => subscription.unsubscribe();
  }, []);

  const openLogin  = useCallback(() => setIsLoginOpen(true),  []);
  const closeLogin = useCallback(() => setIsLoginOpen(false), []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // Traduce los errores comunes de Supabase Auth a español
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

      // onAuthStateChange actualizará isAuthenticated automáticamente.
      setIsLoginOpen(false);
      return { error: null };
    },
    []
  );

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    // onAuthStateChange pondrá isAuthenticated = false automáticamente.
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        isLoginOpen,
        openLogin,
        closeLogin,
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
