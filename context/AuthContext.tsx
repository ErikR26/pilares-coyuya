'use client';

/**
 * AuthContext — estado de autenticación de la aplicación.
 *
 * MODO ACTUAL: simulado en memoria con credenciales de prueba.
 *
 * TODO Supabase — para conectar con Supabase Auth:
 *   1. npm install @supabase/supabase-js @supabase/ssr
 *   2. Crear lib/supabase/client.ts con createBrowserClient()
 *   3. En login():  reemplazar la validación local con:
 *        const { error } = await supabase.auth.signInWithPassword({ email, password })
 *   4. En logout(): reemplazar con:
 *        await supabase.auth.signOut()
 *   5. Para persistencia entre recargas: inicializar isAuthenticated con
 *        (await supabase.auth.getSession()).data.session !== null
 *   6. Suscribirse a onAuthStateChange para mantener el estado sincronizado:
 *        supabase.auth.onAuthStateChange((_event, session) => {
 *          setIsAuthenticated(!!session)
 *        })
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

// ─── Credenciales de prueba ────────────────────────────────────────────────────
// TODO Supabase: eliminar este bloque cuando se integre la autenticación real.
const DEMO_EMAIL = 'admin@pilares.mx';
const DEMO_PASSWORD = 'pilares2025';
// ──────────────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** true cuando el usuario ha iniciado sesión correctamente */
  isAuthenticated: boolean;
  /** Controla la visibilidad del modal de login */
  isLoginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  /**
   * Intenta autenticar al usuario.
   * Retorna { error: null } en éxito o { error: "mensaje" } en fallo.
   * TODO Supabase: reemplazar el cuerpo con supabase.auth.signInWithPassword()
   */
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  /**
   * Cierra la sesión activa.
   * TODO Supabase: reemplazar con await supabase.auth.signOut()
   */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // TODO Supabase: inicializar con (await supabase.auth.getSession()).data.session !== null
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const openLogin = useCallback(() => setIsLoginOpen(true), []);
  const closeLogin = useCallback(() => setIsLoginOpen(false), []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      // TODO Supabase: reemplazar con:
      //   const { error } = await supabase.auth.signInWithPassword({ email, password })
      //   if (error) return { error: error.message }
      //   setIsAuthenticated(true)
      //   return { error: null }

      // Simulación: pequeño delay para imitar una llamada de red
      await new Promise((r) => setTimeout(r, 600));

      if (
        email.trim().toLowerCase() === DEMO_EMAIL &&
        password === DEMO_PASSWORD
      ) {
        setIsAuthenticated(true);
        setIsLoginOpen(false);
        return { error: null };
      }

      return {
        error: 'Correo o contraseña incorrectos. Verifica tus credenciales.',
      };
    },
    []
  );

  const logout = useCallback(() => {
    // TODO Supabase: reemplazar con await supabase.auth.signOut()
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoginOpen, openLogin, closeLogin, login, logout }}
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
