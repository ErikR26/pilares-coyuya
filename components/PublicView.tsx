'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LayoutGrid, CalendarDays, Clock, Rocket } from 'lucide-react';
import { useWorkshops } from '@/context/WorkshopContext';
import SearchBar from '@/components/SearchBar';
import WorkshopCard from '@/components/WorkshopCard';
import ScheduleMesh from '@/components/ScheduleMesh';
import DetailModal from '@/components/DetailModal';
import { Badge } from '@/components/ui/badge';
import {
  type Workshop,
  type WorkshopFocus,
  FOCUS_COLORS,
  isEffectivelyProximo,
} from '@/types/workshop';
import { cn } from '@/lib/utils';

type ViewMode = 'cards' | 'schedule';

// Umbral de scroll a partir del cual se activa el modo compacto en desktop
const SCROLL_THRESHOLD = 50;

export default function PublicView() {
  const { workshops, isLoading } = useWorkshops();
  const searchParams = useSearchParams();
  const router = useRouter();

  const viewParam = searchParams.get('view') as ViewMode | null;
  const view: ViewMode = viewParam === 'schedule' ? 'schedule' : 'cards';

  const [query,            setQuery]            = useState('');
  const [activeFocus,      setActiveFocus]       = useState<WorkshopFocus | null>(null);
  const [selectedWorkshop, setSelectedWorkshop]  = useState<Workshop | null>(null);

  // ── Detección de scroll para el modo compacto en desktop ──────────────────
  // Solo afecta al contenedor sticky en pantallas lg+.
  // En móvil el contenedor no es sticky, por lo que isScrolled es irrelevante.
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    }
    onScroll(); // evalúa la posición inicial al montar
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Próximos: talleres en pre-lanzamiento (excluidos del grid regular) ─────
  const proximos = useMemo(
    () => workshops.filter(isEffectivelyProximo),
    [workshops]
  );

  // ── Filtrado reactivo (solo talleres regulares, sin próximos) ─────────────
  const filtered = useMemo(() => {
    return workshops.filter((w) => {
      if (isEffectivelyProximo(w)) return false;
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

      {/* Próximos cursos — above the fold, se oculta si no hay ninguno */}
      {!isLoading && proximos.length > 0 && (
        <ProximosSection proximos={proximos} onSelect={setSelectedWorkshop} />
      )}

      {/*
        Contenedor de búsqueda:
        • Móvil  (<lg): estático en el flujo del documento. Al hacer scroll,
          la barra desaparece con el contenido — no obstruye la pantalla.
        • Desktop (lg+): sticky bajo el AppHeader (≈129px). Al superar 50px
          de scroll se comprime (padding reducido, fondo semitransparente);
          al volver al inicio recupera el tamaño y opacidad completos.
      */}
      <div
        className={cn(
          // Estructura — móvil estático, desktop sticky
          '-mx-4 sm:-mx-6 px-4 sm:px-6 mb-6 z-40',
          'lg:sticky lg:top-[129px]',
          // Transición suave de todas las propiedades visuales
          'transition-all duration-300 ease-in-out',
          // Estado según scroll (solo relevante en desktop sticky)
          isScrolled
            ? 'py-2 bg-white/75 backdrop-blur-md shadow-sm'
            : 'py-4 bg-white/95 backdrop-blur-sm shadow-md'
        )}
      >
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          activeFocus={activeFocus}
          onFocusToggle={(f) => setActiveFocus(f)}
          compact={isScrolled}
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

// ── Próximos Cursos ────────────────────────────────────────────────────────────

const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

function parseFecha(dateStr: string): { day: string; monthYear: string } {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { day: String(day), monthYear: `${MESES[month - 1]} ${year}` };
}

function ProximosSection({
  proximos,
  onSelect,
}: {
  proximos: Workshop[];
  onSelect: (w: Workshop) => void;
}) {
  return (
    <section aria-labelledby="proximos-heading" className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span
          className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-100 shrink-0"
          aria-hidden="true"
        >
          <Rocket className="w-4 h-4 text-amber-600" />
        </span>
        <h2 id="proximos-heading" className="text-2xl font-bold text-[#0A192F]">
          Próximos Cursos
        </h2>
        <span className="text-base text-gray-400">
          {proximos.length === 1 ? '1 taller próximo' : `${proximos.length} talleres próximos`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {proximos.map((w) => (
          <ProximoCard key={w.id} workshop={w} onClick={onSelect} />
        ))}
      </div>

      <hr className="mt-8 border-gray-200" />
    </section>
  );
}

function ProximoCard({
  workshop,
  onClick,
}: {
  workshop: Workshop;
  onClick: (w: Workshop) => void;
}) {
  const colors = FOCUS_COLORS[workshop.focus];
  const fecha = workshop.fechaInicio ? parseFecha(workshop.fechaInicio) : null;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles del próximo taller ${workshop.workshopName}`}
      onClick={() => onClick(workshop)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick(workshop)}
      className={cn(
        'group cursor-pointer rounded-xl overflow-hidden border-2 bg-white',
        'flex flex-col h-full',
        'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0A192F]/30',
        colors.border
      )}
    >
      <div className={cn('p-3.5 flex flex-col flex-1 space-y-2', colors.bg)}>
        {/* Header: badge + fecha */}
        <div className="flex items-start justify-between gap-2">
          <Badge className={cn('text-xs font-semibold self-start', colors.pill)}>
            {workshop.focus}
          </Badge>

          {fecha && (
            <div className="text-right shrink-0">
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide leading-none mb-0.5">
                Inicio
              </span>
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-3xl font-black text-[#0A192F] leading-none">
                  {fecha.day}
                </span>
                <span className="text-sm font-bold text-gray-600 leading-none">
                  {fecha.monthYear}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <h3 className="text-base font-bold text-gray-900 leading-snug">
          {workshop.workshopName}
        </h3>
        <p className="text-sm text-gray-600 font-medium">
          {workshop.instructorName} {workshop.instructorLastName}
        </p>

        {/* Horarios */}
        <div className="flex flex-col gap-1 mt-auto pt-1" aria-label="Horarios">
          {workshop.schedule.map((entry, idx) => (
            <div
              key={`${entry.day}-${entry.startTime}-${idx}`}
              className="flex items-center gap-1.5 text-sm text-gray-700"
            >
              <Clock className="w-3.5 h-3.5 shrink-0 text-gray-500" aria-hidden="true" />
              <span>
                <span className="font-semibold">{entry.day}:</span>{' '}
                {entry.startTime}–{entry.endTime}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
