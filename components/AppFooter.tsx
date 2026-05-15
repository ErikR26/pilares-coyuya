'use client';

import { useRef } from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * AppFooter — pie de página institucional.
 *
 * Easter egg: 3 clics rápidos (< 1 seg entre cada uno) sobre el texto
 * "Pilares Coyuya" abren el modal de inicio de sesión del administrador.
 * No existe ningún enlace visible ni hint que apunte a /admin.
 */
export default function AppFooter() {
  const { openLogin, isAuthenticated } = useAuth();

  // Usamos refs para evitar cierres sobre estado obsoleto
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  function handleEasterEggClick() {
    // Si ya está autenticado, el easter egg no hace nada
    if (isAuthenticated) return;

    const now = Date.now();
    const elapsed = now - lastClickTimeRef.current;

    if (elapsed < 1000) {
      clickCountRef.current += 1;
    } else {
      // Reinicia el conteo si pasó más de 1 segundo desde el último clic
      clickCountRef.current = 1;
    }

    lastClickTimeRef.current = now;

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      openLogin();
    }
  }

  return (
    <footer className="bg-[#0A192F] mt-16" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Identidad institucional — easter egg oculto aquí */}
          <button
            onClick={handleEasterEggClick}
            aria-label="Pilares Coyuya"
            className="flex items-center gap-3 cursor-default select-none focus-visible:outline-none"
            tabIndex={-1}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10">
              <BookOpen className="w-5 h-5 text-white/70" aria-hidden="true" />
            </div>
            <span className="text-white/70 text-base font-medium">
              Pilares Coyuya
            </span>
          </button>

          {/* Texto legal */}
          <p className="text-white/40 text-sm text-center sm:text-right">
            Programa de Centros Comunitarios — Ciudad de México
            <br />
            Todos los talleres son gratuitos y abiertos a la comunidad.
          </p>
        </div>
      </div>
    </footer>
  );
}
