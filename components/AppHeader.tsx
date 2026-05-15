'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, LayoutGrid, LogOut, Type } from 'lucide-react';
import { useFontSize } from '@/components/FontSizeProvider';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const SCALES = [
  { value: 100, label: 'A',   title: 'Texto normal' },
  { value: 110, label: 'A+',  title: 'Texto grande (+10%)' },
  { value: 120, label: 'A++', title: 'Texto muy grande (+20%)' },
] as const;

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { scale, setScale } = useFontSize();
  const { isAuthenticated, logout } = useAuth();

  const isAdminRoute = pathname?.startsWith('/admin');

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0A192F] shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Top row: logo + font controls */}
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group min-h-[44px]">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
              <BookOpen className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Pilares</p>
              <p className="text-blue-300 text-sm leading-tight font-medium">Coyuya</p>
            </div>
          </Link>

          {/* Controles derechos: zoom + logout (si aplica) */}
          <div className="flex items-center gap-2">
            {/* Botón de cierre de sesión — solo visible cuando está autenticado */}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex items-center gap-2 min-h-[44px] px-4 rounded-xl text-white/80 hover:text-white hover:bg-white/15 text-sm font-medium transition-all"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}

            {/* Font-size control */}
            <div
              className="flex items-center gap-1 bg-white/10 rounded-xl p-1"
              role="group"
              aria-label="Tamaño de texto"
            >
              <Type className="w-4 h-4 text-blue-300 mx-1" aria-hidden="true" />
              {SCALES.map(({ value, label, title }) => (
                <button
                  key={value}
                  onClick={() => setScale(value as 100 | 110 | 120)}
                  title={title}
                  aria-pressed={scale === value}
                  className={cn(
                    'min-w-[44px] min-h-[44px] rounded-lg font-bold transition-all text-sm px-2',
                    scale === value
                      ? 'bg-white text-[#0A192F]'
                      : 'text-white hover:bg-white/20'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Nav: vista pública siempre visible; Panel Admin visible cuando hay sesión activa */}
        <nav
          className="flex items-center gap-1 py-2"
          aria-label="Navegación principal"
        >
          <Link
            href="/?view=cards"
            aria-current={!isAdminRoute ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 px-4 min-h-[44px] rounded-lg text-base font-medium transition-all',
              !isAdminRoute
                ? 'bg-white text-[#0A192F]'
                : 'text-white/80 hover:text-white hover:bg-white/15'
            )}
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            Vista Pública
          </Link>

          {/* Enlace al panel de administración — visible en cualquier ruta cuando hay sesión activa */}
          {isAuthenticated && (
            <Link
              href="/admin"
              aria-current={isAdminRoute ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 px-4 min-h-[44px] rounded-lg text-base font-medium transition-all',
                isAdminRoute
                  ? 'bg-white text-[#0A192F]'
                  : 'text-white/80 hover:text-white hover:bg-white/15'
              )}
            >
              Panel Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
