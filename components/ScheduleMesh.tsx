'use client';

import { useMemo } from 'react';
import { FOCUS_COLORS, ALL_DAYS, type WeekDay, type Workshop } from '@/types/workshop';
import { cn } from '@/lib/utils';

interface ScheduleMeshProps {
  workshops: Workshop[];
  onSelectWorkshop: (w: Workshop) => void;
}

const START_HOUR = 7;
const END_HOUR   = 22;

function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots(); // 30 slots × 30 min

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Cada celda guarda el taller Y el startTime del entry que la cubre,
 * necesario para detectar si la celda es la primera del bloque visual.
 */
interface GridCell {
  workshop: Workshop;
  entryStartTime: string;
}

function buildGrid(workshops: Workshop[]): Record<WeekDay, Record<number, GridCell[]>> {
  const grid = Object.fromEntries(ALL_DAYS.map((d) => [d, {} as Record<number, GridCell[]>])) as Record<WeekDay, Record<number, GridCell[]>>;

  workshops.forEach((ws) => {
    ws.schedule.forEach((entry) => {
      const start = timeToMinutes(entry.startTime);
      const end   = timeToMinutes(entry.endTime);

      TIME_SLOTS.forEach((slot, idx) => {
        const slotMin = timeToMinutes(slot);
        if (slotMin >= start && slotMin < end) {
          if (!grid[entry.day][idx]) grid[entry.day][idx] = [];
          grid[entry.day][idx].push({ workshop: ws, entryStartTime: entry.startTime });
        }
      });
    });
  });

  return grid;
}

export default function ScheduleMesh({ workshops, onSelectWorkshop }: ScheduleMeshProps) {
  const grid = useMemo(() => buildGrid(workshops), [workshops]);

  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
      <table
        className="min-w-[900px] w-full border-collapse text-sm"
        aria-label="Malla horaria de talleres"
      >
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 bg-[#0A192F] text-white text-base font-semibold px-3 py-3 w-20 min-w-[80px] text-center border-r border-white/20"
            >
              Hora
            </th>
            {ALL_DAYS.map((day) => (
              <th
                key={day}
                scope="col"
                className="bg-[#0A192F] text-white text-base font-semibold px-2 py-3 text-center border-r border-white/20 last:border-r-0"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {TIME_SLOTS.map((slot, slotIdx) => {
            const isHour = slot.endsWith(':00');
            return (
              <tr
                key={slot}
                className={isHour ? 'border-t-2 border-gray-200' : 'border-t border-gray-100'}
              >
                {/* Etiqueta de hora */}
                <td
                  className={cn(
                    'sticky left-0 z-10 bg-gray-50 font-mono text-xs px-2 py-1 text-center border-r-2 border-gray-200 align-top',
                    isHour ? 'font-bold text-gray-800 text-sm' : 'text-gray-400'
                  )}
                >
                  {isHour ? slot : ''}
                </td>

                {/* Celdas por día */}
                {ALL_DAYS.map((day) => {
                  const cells = grid[day][slotIdx] ?? [];
                  return (
                    <td
                      key={day}
                      className="border-r border-gray-100 last:border-r-0 p-0.5 align-top"
                    >
                      <div className="flex flex-col gap-0.5">
                        {cells.map(({ workshop: ws, entryStartTime }) => {
                          const colors = FOCUS_COLORS[ws.focus];

                          // La celda muestra la etiqueta solo en el primer bloque del entry
                          const entryStartSlotIdx = TIME_SLOTS.findIndex(
                            (s) => timeToMinutes(s) === timeToMinutes(entryStartTime)
                          );
                          const isFirstSlot = slotIdx === entryStartSlotIdx;

                          return (
                            <button
                              key={ws.id}
                              onClick={() => onSelectWorkshop(ws)}
                              title={`${ws.workshopName} — ${ws.instructorName} ${ws.instructorLastName}\n${entryStartTime} – ${ws.schedule.find(e => e.day === day)?.endTime ?? ''}`}
                              aria-label={`${ws.workshopName}, ${day} ${entryStartTime}`}
                              className={cn(
                                'w-full rounded px-1 py-0.5 text-left transition-all hover:opacity-80',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A192F]',
                                colors.bg, colors.text, 'border', colors.border
                              )}
                            >
                              {isFirstSlot ? (
                                <>
                                  <span className="block text-xs font-bold leading-tight truncate">
                                    {ws.workshopName}
                                  </span>
                                  <span className="block text-xs leading-tight truncate opacity-80">
                                    {ws.instructorName} {ws.instructorLastName.charAt(0)}.
                                  </span>
                                </>
                              ) : (
                                <span className="block h-3" aria-hidden="true" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 px-4 py-3 border-t-2 border-gray-200 bg-gray-50">
        <span className="text-sm font-semibold text-gray-600 self-center">Enfoque:</span>
        {Object.entries(FOCUS_COLORS).map(([focus, colors]) => (
          <span
            key={focus}
            className={cn('px-3 py-1 rounded-full text-sm font-medium border', colors.bg, colors.text, colors.border)}
          >
            {focus}
          </span>
        ))}
      </div>
    </div>
  );
}
