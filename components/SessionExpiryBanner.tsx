'use client';

import { Clock, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * Banner accesible que informa al usuario que su sesión fue cerrada
 * por inactividad. Se renderiza sobre el AppHeader (z-[60]).
 */
export default function SessionExpiryBanner() {
  const { sessionExpiredByInactivity, clearExpiryAlert, openLogin } = useAuth();

  if (!sessionExpiredByInactivity) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between gap-4 bg-amber-500 px-4 sm:px-6 py-4 shadow-lg"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Clock className="w-5 h-5 text-amber-900 shrink-0" aria-hidden="true" />
        <p className="text-base font-semibold text-amber-900 leading-snug">
          Sesión expirada por inactividad.{' '}
          <button
            onClick={openLogin}
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Inicia sesión nuevamente
          </button>{' '}
          para acceder al panel.
        </p>
      </div>
      <button
        onClick={clearExpiryAlert}
        aria-label="Cerrar notificación"
        className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full hover:bg-amber-600/30 transition-colors"
      >
        <X className="w-5 h-5 text-amber-900" aria-hidden="true" />
      </button>
    </div>
  );
}
