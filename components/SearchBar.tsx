'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ALL_FOCUSES, FOCUS_COLORS, type WorkshopFocus } from '@/types/workshop';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  activeFocus: WorkshopFocus | null;
  onFocusToggle: (f: WorkshopFocus | null) => void;
}

export default function SearchBar({
  query,
  onQueryChange,
  activeFocus,
  onFocusToggle,
}: SearchBarProps) {
  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Buscar por taller o instructor…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Buscar talleres"
          className="pl-12 pr-12 h-14 text-lg border-2 border-gray-200 focus:border-[#0A192F] rounded-xl text-gray-900 placeholder:text-gray-400"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Focus filter pills — scroll horizontal en móvil, wrap en sm+ */}
      <div
        className="flex gap-3 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible sm:pb-0"
        role="group"
        aria-label="Filtrar por enfoque"
      >
        <button
          onClick={() => onFocusToggle(null)}
          className={cn(
            'shrink-0 min-h-[44px] px-5 rounded-full text-base font-semibold transition-all border-2',
            activeFocus === null
              ? 'bg-[#0A192F] text-white border-[#0A192F]'
              : 'bg-white text-gray-700 border-gray-300 hover:border-[#0A192F] hover:text-[#0A192F]'
          )}
          aria-pressed={activeFocus === null}
        >
          Todos
        </button>
        {ALL_FOCUSES.map((focus) => {
          const colors = FOCUS_COLORS[focus];
          const isActive = activeFocus === focus;
          return (
            <button
              key={focus}
              onClick={() => onFocusToggle(isActive ? null : focus)}
              aria-pressed={isActive}
              className={cn(
                'shrink-0 min-h-[44px] px-5 rounded-full text-base font-semibold transition-all border-2',
                isActive
                  ? cn(colors.pill, 'border-transparent')
                  : 'bg-white text-gray-700 border-gray-300 hover:border-current'
              )}
            >
              {focus}
            </button>
          );
        })}
      </div>
    </div>
  );
}
