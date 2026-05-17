'use client';

/**
 * AuthContext — autenticación 100 % en memoria (RAM), expiración completamente silenciosa.
 *
 * Garantías:
 *  • isAuthenticated siempre arranca en false. Nunca se restaura desde storage.
 *  • En cada montaje se borran localStorage + sessionStorage + se revoca Supabase.
 *  • Inactividad 30 min → signOut + window.location.replace('/') sin ningún aviso.
 *  • F5 / cierre de pestaña → sesión destruida automáticamente (sin storage).
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

const INACTIVITY_MS = 30 * 60 * 1_000; // 30 minutos

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoginOpen: boolean;
  openLogin:  () => void;
  closeLogin: () => void;
  login:  (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginOpen,     setIsLoginOpen]     = useState(false);

  // ── Limpieza agresiva en el primer montaje ─────────────────────────────────
  // Borra cualquier token residual de sesiones previas (incluyendo versiones
  // antiguas con persistSession:true) y revoca en Supabase.
  useEffect(() => {
    sessionStorage.clear();
    localStorage.clear();
    void supabase.auth.signOut();
  }, []);

  // ── Timer de inactividad — expiración SILENCIOSA ───────────────────────────
  // expireRef: referencia siempre fresca; evita closures obsoletos sin
  // forzar re-ejecuciones del useEffect de escucha de eventos.
  const expireRef = useRef<() => void>(() => {});
  expireRef.current = () => {
    setIsAuthenticated(false);
    sessionStorage.clear();
    localStorage.clear();
    void supabase.auth.signOut();
    // Redireccionamiento directo y limpio. Sin alerta, sin modal, sin toast.
    window.location.replace('/');
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    let timer = setTimeout(() => expireRef.current(), INACTIVITY_MS);

    function resetTimer() {
      clearTimeout(timer);
      timer = setTimeout(() => expireRef.current(), INACTIVITY_MS);
    }

    const EVENTS = ['mousemove', 'keydown', 'click', 'scroll'] as const;
    EVENTS.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    return () => {
      clearTimeout(timer);
      EVENTS.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isAuthenticated]);

  // ── Acciones públicas ──────────────────────────────────────────────────────
  const openLogin  = useCallback(() => setIsLoginOpen(true),  []);
  const closeLogin = useCallback(() => setIsLoginOpen(false), []);

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

      // Credenciales válidas — sesión solo en RAM
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
    <AuthContext.Provider value={{ isAuthenticated, isLoginOpen, openLogin, closeLogin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
