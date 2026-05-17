'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LayoutGrid, CalendarDays } from 'lucide-react';
import { useWorkshops } from '@/context/WorkshopContext';
import SearchBar from '@/components/SearchBar';
import WorkshopCard from '@/components/WorkshopCard';
import ScheduleMesh from '@/components/ScheduleMesh';
import DetailModal from '@/components/DetailModal';
import { type Workshop, type WorkshopFocus } from '@/types/workshop';
import { cn } from '@/lib/utils';

type ViewMode = 'cards' | 'schedule';

export default function PublicView() {
  const { workshops, isLoading } = useWorkshops();
  const searchParams = useSearchParams();
  const router = useRouter();

  const viewParam = searchParams.get('view') as ViewMode | null;
  const view: ViewMode = viewParam === 'schedule' ? 'schedule' : 'cards';

  const [query, setQuery] = useState('');
  const [activeFocus, setActiveFocus] = useState<WorkshopFocus | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);

  const filtered = useMemo(() => {
    return workshops.filter((w) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        w.workshopName.toLowerCase().includes(q) ||
        w.instructorName.toLowerCase().includes(q) ||
        w.instructorLastName.toLowerCase().includes(q);
      const matchesFocus = !activeFocus || w.focus === activeFocus;
      return matchesQuery && matchesFocus;
    });
  }, [workshops, query, activeFocus]);

  function switchView(v: ViewMode) {
    router.push(`/?view=${v}`);
  }

  return (
    <>
      {/* Page heading */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0A192F]">
          Talleres Comunitarios
        </h1>
        <p className="text-lg text-gray-600">
          Explora nuestra oferta de talleres gratuitos para toda la comunidad.
        </p>
      </div>

      {/* Search + filters — sticky bajo el AppHeader (height ≈ 129 px) */}
      <div className="sticky top-[129px] z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mb-6 bg-white/95 backdrop-blur-sm shadow-md">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          activeFocus={activeFocus}
          onFocusToggle={(f) => setActiveFocus(f)}
        />
      </div>

      {/* View toggle */}
      <div
        className="flex items-center gap-2 mb-6 flex-wrap"
        role="group"
        aria-label="Cambiar vista"
      >
        <ViewButton
          active={view === 'cards'}
          icon={<LayoutGrid className="w-5 h-5" />}
          label="Tarjetas"
          onClick={() => switchView('cards')}
        />
        <ViewButton
          active={view === 'schedule'}
          icon={<CalendarDays className="w-5 h-5" />}
          label="Malla Horaria"
          onClick={() => switchView('schedule')}
        />
        <span className="ml-auto text-base text-gray-500">
          {filtered.length} taller{filtered.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-gray-400 text-lg">
          <span className="w-6 h-6 border-2 border-gray-300 border-t-[#0A192F] rounded-full animate-spin" aria-hidden="true" />
          Cargando talleres…
        </div>
      ) : view === 'cards' ? (
        filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((w) => (
              <WorkshopCard key={w.id} workshop={w} onClick={setSelectedWorkshop} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )
      ) : (
        <ScheduleMesh workshops={filtered} onSelectWorkshop={setSelectedWorkshop} />
      )}

      {/* Detail modal */}
      <DetailModal
        workshop={selectedWorkshop}
        onClose={() => setSelectedWorkshop(null)}
      />
    </>
  );
}

function ViewButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-2 min-h-[44px] px-5 rounded-xl text-base font-semibold border-2 transition-all',
        active
          ? 'bg-[#0A192F] text-white border-[#0A192F]'
          : 'bg-white text-gray-700 border-gray-300 hover:border-[#0A192F] hover:text-[#0A192F]'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <CalendarDays className="w-16 h-16 text-gray-300" aria-hidden="true" />
      <p className="text-2xl font-semibold text-gray-400">
        No se encontraron talleres
      </p>
      <p className="text-lg text-gray-400">
        Intenta ajustar los filtros de búsqueda.
      </p>
    </div>
  );
}
