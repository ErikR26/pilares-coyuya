'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
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

export default function LoginModal() {
  const { isLoginOpen, closeLogin, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleClose() {
    // Limpia el formulario al cerrar
    setEmail('');
    setPassword('');
    setError(null);
    setShowPassword(false);
    closeLogin();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return; }
    if (!password) { setError('Ingresa tu contraseña.'); return; }

    setIsLoading(true);
    const { error: loginError } = await login(email, password);
    setIsLoading(false);

    if (loginError) {
      setError(loginError);
    } else {
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
          {/* Error global */}
          {error && (
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
            <Label
              htmlFor="login-email"
              className="text-base font-semibold text-gray-700"
            >
              Correo Electrónico
            </Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="admin@pilares.mx"
              disabled={isLoading}
              className="h-13 text-lg border-2 border-gray-200 focus:border-[#0A192F] rounded-xl"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <Label
              htmlFor="login-password"
              className="text-base font-semibold text-gray-700"
            >
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
                disabled={isLoading}
                className="h-13 text-lg border-2 border-gray-200 focus:border-[#0A192F] rounded-xl pr-14"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {showPassword
                  ? <EyeOff className="w-5 h-5" aria-hidden="true" />
                  : <Eye className="w-5 h-5" aria-hidden="true" />
                }
              </button>
            </div>
          </div>

          {/* Botón de envío */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[52px] text-lg font-semibold bg-[#0A192F] hover:bg-[#172a46] text-white rounded-xl gap-2 mt-2"
          >
            {isLoading ? (
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

          {/* Hint para demo */}
          <p className="text-sm text-gray-400 text-center pb-1">
            Demo: <span className="font-mono">admin@pilares.mx</span> / <span className="font-mono">pilares2025</span>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
