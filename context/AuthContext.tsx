'use client';

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

/** 30 minutos sin actividad → cierre automático de sesión */
const INACTIVITY_MS = 30 * 60 * 1_000;

interface AuthContextValue {
  isAuthenticated: boolean;
  /** true mientras se verifica la sesión inicial (evita flash de "no autenticado") */
  isAuthLoading: boolean;
  isLoginOpen: boolean;
  /** true cuando la sesión fue cerrada por inactividad; mostrar banner al usuario */
  sessionExpiredByInactivity: boolean;
  openLogin:  () => void;
  closeLogin: () => void;
  /** Descarta el banner de sesión expirada */
  clearExpiryAlert: () => void;
  login:  (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated]               = useState(false);
  const [isAuthLoading,   setIsAuthLoading]                 = useState(true);
  const [isLoginOpen,     setIsLoginOpen]                   = useState(false);
  const [sessionExpiredByInactivity, setSessionExpired]     = useState(false);

  // ── Inicialización y escucha de cambios de sesión ──────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
        setIsAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Timer de inactividad (activo solo cuando hay sesión) ───────────────────
  // expireRef holds a fresh closure on every render so the timer callback
  // never reads stale state, without triggering extra effect runs.
  const expireRef = useRef<() => void>(() => {});
  expireRef.current = () => {
    void supabase.auth.signOut();
    setSessionExpired(true);
    // Redirigir a la vista pública
    window.location.assign('/');
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    let timer = setTimeout(() => expireRef.current(), INACTIVITY_MS);

    function resetTimer() {
      clearTimeout(timer);
      timer = setTimeout(() => expireRef.current(), INACTIVITY_MS);
    }

    const EVENTS = ['mousemove', 'keydown', 'click', 'touchstart'] as const;
    EVENTS.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

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

  const closeLogin      = useCallback(() => setIsLoginOpen(false),  []);
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

      setIsLoginOpen(false);
      return { error: null };
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
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
