'use client';

import { useMemo } from 'react';
import { FOCUS_COLORS, ALL_DAYS, type WeekDay, type Workshop } from '@/types/workshop';
import { cn } from '@/lib/utils';

interface ScheduleMeshProps {
  workshops: Workshop[];
  onSelectWorkshop: (w: Workshop) => void;
}

interface AgendaEntry {
  workshop: Workshop;
  startTime: string;
  endTime: string;
}

type DayAgenda = Record<WeekDay, AgendaEntry[]>;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function buildAgenda(workshops: Workshop[]): DayAgenda {
  const agenda = Object.fromEntries(
    ALL_DAYS.map((d) => [d, [] as AgendaEntry[]])
  ) as DayAgenda;

  workshops.forEach((ws) => {
    ws.schedule.forEach((entry) => {
      agenda[entry.day].push({
        workshop: ws,
        startTime: entry.startTime,
        endTime:   entry.endTime,
      });
    });
  });

  ALL_DAYS.forEach((day) => {
    agenda[day].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
  });

  return agenda;
}

export default function ScheduleMesh({ workshops, onSelectWorkshop }: ScheduleMeshProps) {
  const agenda = useMemo(() => buildAgenda(workshops), [workshops]);

  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Columnas por día */}
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[1120px]"
          style={{ gridTemplateColumns: 'repeat(7, minmax(160px, 1fr))' }}
          role="grid"
          aria-label="Agenda semanal de talleres"
        >
          {ALL_DAYS.map((day, colIdx) => {
            const entries = agenda[day];
            return (
              <div
                key={day}
                role="gridcell"
                className={cn(
                  'flex flex-col',
                  colIdx < ALL_DAYS.length - 1 && 'border-r-2 border-gray-200'
                )}
              >
                {/* Encabezado de día */}
                <div className="bg-[#0A192F] px-4 py-4 text-center">
                  <span className="text-white text-base font-bold tracking-wide">
                    {day}
                  </span>
                </div>

                {/* Tarjetas de talleres */}
                <div className="flex flex-col gap-3 p-3">
                  {entries.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[80px]">
                      <span className="text-sm text-gray-300 text-center italic">
                        Sin talleres
                      </span>
                    </div>
                  ) : (
                    entries.map((entry, idx) => {
                      const colors = FOCUS_COLORS[entry.workshop.focus];
                      return (
                        <button
                          key={`${entry.workshop.id}-${entry.startTime}-${idx}`}
                          onClick={() => onSelectWorkshop(entry.workshop)}
                          aria-label={`${entry.workshop.workshopName}, ${day} ${entry.startTime} a ${entry.endTime}. Toca para ver detalles.`}
                          className={cn(
                            'w-full text-left rounded-xl px-4 py-4 min-h-[44px]',
                            'border-l-4 transition-opacity',
                            'hover:opacity-80',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A192F] focus-visible:ring-offset-2',
                            colors.bg,
                            colors.text,
                            colors.border
                          )}
                        >
                          {/* Hora de inicio */}
                          <time
                            dateTime={entry.startTime}
                            className="block text-base font-black tracking-wide leading-tight"
                          >
                            {formatTime12h(entry.startTime)}
                          </time>

                          {/* Nombre del taller */}
                          <span className="block text-sm font-semibold leading-snug mt-1.5">
                            {entry.workshop.workshopName}
                          </span>

                          {/* Instructor */}
                          <span className="block text-xs leading-tight mt-1 opacity-70">
                            {entry.workshop.instructorName}{' '}
                            {entry.workshop.instructorLastName}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda de enfoques */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t-2 border-gray-200 bg-gray-50">
        <span className="text-sm font-semibold text-gray-600">Enfoque:</span>
        {Object.entries(FOCUS_COLORS).map(([focus, colors]) => (
          <span
            key={focus}
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium border',
              colors.bg,
              colors.text,
              colors.border
            )}
          >
            {focus}
          </span>
        ))}
      </div>
    </div>
  );
}
