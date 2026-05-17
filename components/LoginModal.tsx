'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, ShieldCheck, AlertCircle, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

const MAX_ATTEMPTS  = 5;
const LOCKOUT_MS    = 5 * 60 * 1_000; // 5 minutos

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LoginModal() {
  const { isLoginOpen, closeLogin, login } = useAuth();
  const router = useRouter();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [isLoading,    setIsLoading]    = useState(false);

  // ── Control de intentos fallidos ───────────────────────────────────────────
  const [failedAttempts,   setFailedAttempts]   = useState(0);
  const [lockoutSecsLeft,  setLockoutSecsLeft]  = useState(0);
  const lockoutEndRef = useRef<number>(0);

  // Contador regresivo mientras la cuenta está bloqueada
  useEffect(() => {
    if (lockoutSecsLeft <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutEndRef.current - Date.now()) / 1_000);
      if (remaining <= 0) {
        setLockoutSecsLeft(0);
        setFailedAttempts(0);
      } else {
        setLockoutSecsLeft(remaining);
      }
    }, 1_000);
    return () => clearInterval(interval);
  }, [lockoutSecsLeft]);

  const isLocked         = lockoutSecsLeft > 0;
  const attemptsLeft     = MAX_ATTEMPTS - failedAttempts;
  const showAttemptsWarn = failedAttempts > 0 && !isLocked;

  function handleClose() {
    setEmail('');
    setPassword('');
    setError(null);
    setShowPassword(false);
    // No reiniciamos el contador de intentos al cerrar: persiste durante la sesión de página
    closeLogin();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Bloqueo activo: no procesar
    if (isLocked) return;

    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return; }
    if (!password)     { setError('Ingresa tu contraseña.');         return; }

    setIsLoading(true);
    const { error: loginError } = await login(email, password);
    setIsLoading(false);

    if (loginError) {
      const next = failedAttempts + 1;
      setFailedAttempts(next);

      if (next >= MAX_ATTEMPTS) {
        // Activar bloqueo de 5 minutos
        lockoutEndRef.current = Date.now() + LOCKOUT_MS;
        setLockoutSecsLeft(Math.ceil(LOCKOUT_MS / 1_000));
        setError(null); // el mensaje de bloqueo reemplaza al error
      } else {
        setError(loginError);
      }
    } else {
      // Login exitoso: resetear contadores y navegar
      setFailedAttempts(0);
      lockoutEndRef.current = 0;
      handleClose();
      router.push('/admin');
    }
  }

  return (
    <Dialog open={isLoginOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl gap-0">
        {/* Header decorativo */}
        <div className="bg-[#0A192F] px-8 pt-8 pb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/10 mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold text-center">
              Acceso Restringido
            </DialogTitle>
            <DialogDescription className="text-blue-300 text-base text-center mt-1">
              Panel de administración — Pilares Coyuya
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate className="px-8 py-7 space-y-5 bg-white">

          {/* Mensaje de bloqueo por intentos */}
          {isLocked && (
            <div
              role="alert"
              className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
            >
              <Lock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-base text-red-700">
                Acceso bloqueado temporalmente por demasiados intentos fallidos.
                Intenta de nuevo en{' '}
                <strong className="tabular-nums">{formatCountdown(lockoutSecsLeft)}</strong>.
              </p>
            </div>
          )}

          {/* Advertencia de intentos restantes */}
          {showAttemptsWarn && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5"
            >
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
              <p className="text-sm text-amber-700 font-medium">
                {attemptsLeft} intento{attemptsLeft !== 1 ? 's' : ''} restante{attemptsLeft !== 1 ? 's' : ''} antes del bloqueo de 5 minutos.
              </p>
            </div>
          )}

          {/* Error de credenciales */}
          {error && !isLocked && (
            <div
              role="alert"
              className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-base text-red-700">{error}</p>
            </div>
          )}

          {/* Correo electrónico */}
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-base font-semibold text-gray-700">
              Correo Electrónico
            </Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="admin@pilares.mx"
              disabled={isLoading || isLocked}
              className="h-13 text-lg border-2 border-gray-200 focus:border-[#0A192F] rounded-xl"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-base font-semibold text-gray-700">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••••"
                disabled={isLoading || isLocked}
                className="h-13 text-lg border-2 border-gray-200 focus:border-[#0A192F] rounded-xl pr-14"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                disabled={isLocked}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
              >
                {showPassword
                  ? <EyeOff className="w-5 h-5" aria-hidden="true" />
                  : <Eye    className="w-5 h-5" aria-hidden="true" />
                }
              </button>
            </div>
          </div>

          {/* Botón de envío */}
          <Button
            type="submit"
            disabled={isLoading || isLocked}
            className="w-full min-h-[52px] text-lg font-semibold bg-[#0A192F] hover:bg-[#172a46] text-white rounded-xl gap-2 mt-2 disabled:opacity-60"
          >
            {isLocked ? (
              <>
                <Lock className="w-5 h-5" aria-hidden="true" />
                Bloqueado — {formatCountdown(lockoutSecsLeft)}
              </>
            ) : isLoading ? (
              <>
                <span
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
                Verificando…
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" aria-hidden="true" />
                Iniciar Sesión
              </>
            )}
          </Button>

          <p className="text-sm text-gray-400 text-center pb-1">
            Demo: <span className="font-mono">admin@pilares.mx</span> / <span className="font-mono">pilares2025</span>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
