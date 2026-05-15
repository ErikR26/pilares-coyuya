'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  CalendarClock,
  Users,
  Baby,
  Layers,
  Backpack,
  User,
  Notebook,
} from 'lucide-react';
import { FOCUS_COLORS, type Workshop } from '@/types/workshop';
import { cn } from '@/lib/utils';

interface DetailModalProps {
  workshop: Workshop | null;
  onClose: () => void;
}

export default function DetailModal({ workshop, onClose }: DetailModalProps) {
  if (!workshop) return null;

  const colors = FOCUS_COLORS[workshop.focus];

  return (
    <Dialog open={!!workshop} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        {/* Hero */}
        <div className="relative h-52 w-full overflow-hidden rounded-t-2xl bg-gray-100">
          {workshop.imageUrl ? (
            <Image
              src={workshop.imageUrl}
              alt={`Imagen del taller ${workshop.workshopName}`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Notebook className="w-16 h-16 text-gray-300" aria-hidden="true" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <Badge className={cn('text-sm font-semibold mb-2', colors.pill)}>
              {workshop.focus}
            </Badge>
            <DialogHeader>
              <DialogTitle className="text-white text-2xl font-bold leading-tight">
                {workshop.workshopName}
              </DialogTitle>
            </DialogHeader>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          {/* Instructor */}
          <Row
            icon={<User className="w-5 h-5" />}
            label="Instructor"
            value={`${workshop.instructorName} ${workshop.instructorLastName}`}
          />

          {/* Descripción */}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Descripción
            </p>
            <p className="text-lg text-gray-900 leading-relaxed">
              {workshop.description}
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* ── Horarios por día ──────────────────────────────────────────── */}
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-[#0A192F] shrink-0">
              <CalendarClock className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide leading-none mb-2">
                Horarios
              </p>
              <ul className="space-y-1.5" aria-label="Lista de horarios">
                {workshop.schedule.map((entry) => (
                  <li
                    key={entry.day}
                    className="flex items-center gap-2 text-lg text-gray-900"
                  >
                    <span
                      className={cn(
                        'inline-block w-2 h-2 rounded-full shrink-0',
                        colors.pill.split(' ')[0]
                      )}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="font-semibold">{entry.day}:</span>{' '}
                      {entry.startTime} – {entry.endTime} hrs
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Público */}
          <Row
            icon={<Users className="w-5 h-5" />}
            label="Público objetivo"
            value={workshop.targetAudience}
          />
          <Row
            icon={<Layers className="w-5 h-5" />}
            label="Rango de edad recomendado"
            value={workshop.recommendedAgeRange}
          />
          <Row
            icon={<Baby className="w-5 h-5" />}
            label="Apto para menores"
            value={workshop.forMinors ? 'Sí' : 'No'}
          />

          <hr className="border-gray-100" />

          {/* Materiales */}
          <Row
            icon={<Backpack className="w-5 h-5" />}
            label="Materiales requeridos"
            value={workshop.requiredMaterials}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[#0A192F] shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide leading-none mb-1">
          {label}
        </p>
        <p className="text-lg text-gray-900">{value}</p>
      </div>
    </div>
  );
}
