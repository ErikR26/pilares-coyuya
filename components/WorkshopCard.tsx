'use client';

import Image from 'next/image';
import { Clock, Notebook } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FOCUS_COLORS, type Workshop } from '@/types/workshop';
import { cn } from '@/lib/utils';

interface WorkshopCardProps {
  workshop: Workshop;
  onClick: (w: Workshop) => void;
}

const MAX_VISIBLE = 2;

export default function WorkshopCard({ workshop, onClick }: WorkshopCardProps) {
  const colors = FOCUS_COLORS[workshop.focus];
  const { schedule } = workshop;
  const visible = schedule.slice(0, MAX_VISIBLE);
  const extra   = schedule.length - MAX_VISIBLE;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles del taller ${workshop.workshopName}`}
      onClick={() => onClick(workshop)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick(workshop)}
      className={cn(
        'group cursor-pointer rounded-2xl overflow-hidden border-2 bg-white transition-all duration-200',
        'hover:shadow-xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0A192F]/30',
        colors.border
      )}
    >
      {/* Imagen */}
      <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
        {workshop.imageUrl ? (
          <Image
            src={workshop.imageUrl}
            alt={`Imagen del taller ${workshop.workshopName}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Notebook className="w-12 h-12 text-gray-300" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Cuerpo */}
      <div className={cn('p-4 space-y-3', colors.bg)}>
        <Badge className={cn('text-xs font-semibold', colors.pill)}>
          {workshop.focus}
        </Badge>

        <h3 className="text-xl font-bold text-gray-900 leading-snug">
          {workshop.workshopName}
        </h3>

        <p className="text-base text-gray-600 font-medium">
          {workshop.instructorName} {workshop.instructorLastName}
        </p>

        {/* Horarios */}
        <div className="flex flex-col gap-1 pt-1" aria-label="Horarios">
          {visible.map((entry) => (
            <div key={entry.day} className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 shrink-0 text-gray-500" aria-hidden="true" />
              <span>
                <span className="font-semibold">{entry.day}:</span>{' '}
                {entry.startTime} – {entry.endTime}
              </span>
            </div>
          ))}
          {extra > 0 && (
            <p className="text-sm text-gray-500 pl-6">
              +{extra} horario{extra > 1 ? 's' : ''} más
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
