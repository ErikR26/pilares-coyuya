'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ALL_DAYS,
  ALL_FOCUSES,
  type ScheduleEntry,
  type WeekDay,
  type Workshop,
  type WorkshopFocus,
} from '@/types/workshop';
import { cn } from '@/lib/utils';
import { stripHtml } from '@/lib/sanitize';

// ── Opciones de horario (07:00 – 22:00, pasos de 30 min) ──────────────────────
function buildTimeOptions(fromH: number, fromM: number, toH: number, toM: number): string[] {
  const opts: string[] = [];
  let h = fromH, m = fromM;
  while (h < toH || (h === toH && m <= toM)) {
    opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) { m = 0; h++; }
  }
  return opts;
}
const START_OPTIONS = buildTimeOptions(7, 0, 21, 30);  // 07:00 – 21:30
const END_OPTIONS   = buildTimeOptions(7, 30, 22, 0);  // 07:30 – 22:00

/** Suma 30 min a una cadena HH:mm, con techo en 22:00 */
function addHalfHour(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const total = Math.min(h * 60 + m + 30, 22 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
// ──────────────────────────────────────────────────────────────────────────────

interface WorkshopFormProps {
  workshop: Workshop | null;
  onSave: (data: Omit<Workshop, 'id'>) => void;
  onClose: () => void;
}

const EMPTY: Omit<Workshop, 'id'> = {
  instructorName: '',
  instructorLastName: '',
  focus: 'Ciberescuela',
  workshopName: '',
  description: '',
  schedule: [],
  targetAudience: '',
  forMinors: false,
  recommendedAgeRange: '',
  requiredMaterials: '',
  imageUrl: '',
};

interface ScheduleErrors {
  global?: string;
  entries: Record<number, string>;
}

export default function WorkshopForm({ workshop, onSave, onClose }: WorkshopFormProps) {
  const [form, setForm] = useState<Omit<Workshop, 'id'>>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Omit<Workshop, 'id' | 'schedule'>, string>>>({});
  const [scheduleErrors, setScheduleErrors] = useState<ScheduleErrors>({ entries: {} });

  useEffect(() => {
    setForm(workshop ? { ...workshop } : EMPTY);
    setFieldErrors({});
    setScheduleErrors({ entries: {} });
  }, [workshop]);

  function setField<K extends keyof Omit<Workshop, 'id'>>(key: K, value: Omit<Workshop, 'id'>[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // ── Validación ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const fe: typeof fieldErrors = {};
    if (!form.instructorName.trim())      fe.instructorName = 'Campo requerido';
    if (!form.instructorLastName.trim())  fe.instructorLastName = 'Campo requerido';
    if (!form.workshopName.trim())        fe.workshopName = 'Campo requerido';
    if (!form.description.trim())         fe.description = 'Campo requerido';
    if (!form.targetAudience.trim())      fe.targetAudience = 'Campo requerido';
    if (!form.recommendedAgeRange.trim()) fe.recommendedAgeRange = 'Campo requerido';
    if (!form.requiredMaterials.trim())   fe.requiredMaterials = 'Campo requerido';
    setFieldErrors(fe);

    const se: ScheduleErrors = { entries: {} };
    if (form.schedule.length === 0) {
      se.global = 'Agrega al menos un día con su horario.';
    } else {
      form.schedule.forEach((entry, idx) => {
        if (entry.startTime >= entry.endTime) {
          se.entries[idx] = 'La hora de fin debe ser posterior al inicio.';
        }
      });
    }
    setScheduleErrors(se);

    return (
      Object.keys(fe).length === 0 &&
      !se.global &&
      Object.keys(se.entries).length === 0
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // Sanitizar campos de texto para prevenir XSS almacenado en Supabase
    const sanitized: Omit<Workshop, 'id'> = {
      ...form,
      instructorName:     stripHtml(form.instructorName),
      instructorLastName: stripHtml(form.instructorLastName),
      workshopName:       stripHtml(form.workshopName),
      description:        stripHtml(form.description),
      targetAudience:     stripHtml(form.targetAudience),
      recommendedAgeRange: stripHtml(form.recommendedAgeRange),
      requiredMaterials:  stripHtml(form.requiredMaterials),
    };
    onSave(sanitized);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {workshop ? 'Editar taller' : 'Crear nuevo taller'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5 pt-2">
          {/* Instructor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre del instructor" error={fieldErrors.instructorName} required>
              <Input
                value={form.instructorName}
                onChange={(e) => setField('instructorName', e.target.value)}
                placeholder="María"
                className="h-12 text-lg"
              />
            </Field>
            <Field label="Apellido" error={fieldErrors.instructorLastName} required>
              <Input
                value={form.instructorLastName}
                onChange={(e) => setField('instructorLastName', e.target.value)}
                placeholder="González"
                className="h-12 text-lg"
              />
            </Field>
          </div>

          {/* Enfoque */}
          <Field label="Enfoque" required>
            <Select value={form.focus} onValueChange={(v) => setField('focus', v as WorkshopFocus)}>
              <SelectTrigger className="h-12 text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_FOCUSES.map((f) => (
                  <SelectItem key={f} value={f} className="text-base">{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Nombre del taller */}
          <Field label="Nombre del taller" error={fieldErrors.workshopName} required>
            <Input
              value={form.workshopName}
              onChange={(e) => setField('workshopName', e.target.value)}
              placeholder="Ej. Introducción a la Computación"
              className="h-12 text-lg"
            />
          </Field>

          {/* Descripción */}
          <Field label="Descripción breve" error={fieldErrors.description} required>
            <Textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Descripción para difusión pública…"
              rows={3}
              className="text-lg resize-none"
            />
          </Field>

          {/* ── Horarios ────────────────────────────────────────────────────── */}
          <Field label="Días y horarios" error={scheduleErrors.global} required>
            <ScheduleBuilder
              schedule={form.schedule}
              onChange={(s) => {
                setField('schedule', s);
                setScheduleErrors({ entries: {} });
              }}
              entryErrors={scheduleErrors.entries}
            />
          </Field>

          {/* Público objetivo */}
          <Field label="Público objetivo" error={fieldErrors.targetAudience} required>
            <Input
              value={form.targetAudience}
              onChange={(e) => setField('targetAudience', e.target.value)}
              placeholder="Ej. Adultos mayores sin experiencia previa"
              className="h-12 text-lg"
            />
          </Field>

          {/* Para menores */}
          <Field label="¿Apto para menores de edad?">
            <div className="flex gap-3 pt-1">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setField('forMinors', val)}
                  aria-pressed={form.forMinors === val}
                  className={cn(
                    'min-h-[44px] px-6 rounded-lg text-lg font-medium border-2 transition-all',
                    form.forMinors === val
                      ? 'bg-[#0A192F] text-white border-[#0A192F]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#0A192F]'
                  )}
                >
                  {val ? 'Sí' : 'No'}
                </button>
              ))}
            </div>
          </Field>

          {/* Rango de edad */}
          <Field label="Rango de edad recomendado" error={fieldErrors.recommendedAgeRange} required>
            <Input
              value={form.recommendedAgeRange}
              onChange={(e) => setField('recommendedAgeRange', e.target.value)}
              placeholder="Ej. 55 – 80 años"
              className="h-12 text-lg"
            />
          </Field>

          {/* Materiales */}
          <Field label="Materiales requeridos" error={fieldErrors.requiredMaterials} required>
            <Textarea
              value={form.requiredMaterials}
              onChange={(e) => setField('requiredMaterials', e.target.value)}
              placeholder="Ej. Ropa cómoda y mat de yoga…"
              rows={2}
              className="text-lg resize-none"
            />
          </Field>

          {/* URL imagen */}
          <Field label="URL de imagen">
            <Input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setField('imageUrl', e.target.value)}
              placeholder="https://..."
              className="h-12 text-lg"
            />
          </Field>

          <DialogFooter className="pt-2 flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="min-h-[48px] text-lg px-6">
              Cancelar
            </Button>
            <Button type="submit" className="min-h-[48px] text-lg px-8 bg-[#0A192F] hover:bg-[#172a46] text-white">
              {workshop ? 'Guardar cambios' : 'Crear taller'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── ScheduleBuilder ────────────────────────────────────────────────────────────

interface ScheduleBuilderProps {
  schedule: ScheduleEntry[];
  onChange: (s: ScheduleEntry[]) => void;
  entryErrors: Record<number, string>;
}

function sortSchedule(entries: ScheduleEntry[]): ScheduleEntry[] {
  return [...entries].sort(
    (a, b) =>
      ALL_DAYS.indexOf(a.day) - ALL_DAYS.indexOf(b.day) ||
      a.startTime.localeCompare(b.startTime)
  );
}

function ScheduleBuilder({ schedule, onChange, entryErrors }: ScheduleBuilderProps) {

  /** Añade una nueva franja para el día dado y re-ordena */
  function addEntry(day: WeekDay) {
    const newEntry: ScheduleEntry = { day, startTime: '09:00', endTime: '10:00' };
    onChange(sortSchedule([...schedule, newEntry]));
  }

  /** Añade una nueva franja usando el último día registrado (o Lunes si no hay ninguno) */
  function addBlankEntry() {
    const lastDay: WeekDay = schedule.length > 0
      ? schedule[schedule.length - 1].day
      : 'Lunes';
    addEntry(lastDay);
  }

  /** Elimina la franja en la posición idx */
  function removeEntry(idx: number) {
    onChange(schedule.filter((_, i) => i !== idx));
  }

  /** Actualiza un campo de la franja en la posición idx y re-ordena si cambió el día */
  function updateEntry(idx: number, field: 'day' | 'startTime' | 'endTime', value: string) {
    const updated = schedule.map((e, i) => {
      if (i !== idx) return e;
      if (field === 'startTime') {
        const newEnd = value >= e.endTime ? addHalfHour(value) : e.endTime;
        return { ...e, startTime: value, endTime: newEnd };
      }
      return { ...e, [field]: value };
    }) as ScheduleEntry[];

    onChange(field === 'day' ? sortSchedule(updated) : updated);
  }

  return (
    <div className="space-y-3">
      {/* Botones de acceso rápido por día */}
      <div
        className="flex flex-wrap gap-2 pt-1"
        role="group"
        aria-label="Añadir día al horario"
      >
        {ALL_DAYS.map((day) => {
          const count  = schedule.filter((e) => e.day === day).length;
          const active = count > 0;
          return (
            <button
              key={day}
              type="button"
              onClick={() => addEntry(day)}
              title={active ? `Añadir otra franja para el ${day}` : `Añadir ${day}`}
              className={cn(
                'relative min-h-[44px] px-4 rounded-lg text-base font-medium border-2 transition-all',
                active
                  ? 'bg-[#0A192F] text-white border-[#0A192F]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#0A192F]'
              )}
            >
              {day}
              {/* Insignia de conteo cuando hay más de una franja ese día */}
              {count > 1 && (
                <span
                  aria-label={`${count} franjas`}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center leading-none"
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista de franjas horarias */}
      {schedule.length > 0 && (
        <div className="space-y-2 pt-1" role="list" aria-label="Horarios configurados">
          {schedule.map((entry, idx) => {
            const endOpts  = END_OPTIONS.filter((t) => t > entry.startTime);
            const entryErr = entryErrors[idx];
            return (
              <div
                key={idx}
                role="listitem"
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-xl border-2 px-4 py-3 bg-gray-50 transition-colors',
                  entryErr ? 'border-red-300 bg-red-50' : 'border-gray-200'
                )}
              >
                {/* Selector de día */}
                <div className="min-w-[130px]">
                  <Select
                    value={entry.day}
                    onValueChange={(v) => v && updateEntry(idx, 'day', v)}
                  >
                    <SelectTrigger className="h-11 text-base font-bold text-[#0A192F]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_DAYS.map((d) => (
                        <SelectItem key={d} value={d} className="text-base">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Inicio */}
                <div className="flex items-center gap-2 min-w-[140px]">
                  <Label className="text-sm text-gray-500 shrink-0 mb-0">Inicio</Label>
                  <Select
                    value={entry.startTime}
                    onValueChange={(v) => v && updateEntry(idx, 'startTime', v)}
                  >
                    <SelectTrigger className="h-11 text-base flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {START_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t} className="text-base font-mono">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <span className="text-gray-400 font-bold" aria-hidden="true">–</span>

                {/* Fin */}
                <div className="flex items-center gap-2 min-w-[140px]">
                  <Label className="text-sm text-gray-500 shrink-0 mb-0">Fin</Label>
                  <Select
                    value={entry.endTime}
                    onValueChange={(v) => v && updateEntry(idx, 'endTime', v)}
                  >
                    <SelectTrigger className="h-11 text-base flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {endOpts.map((t) => (
                        <SelectItem key={t} value={t} className="text-base font-mono">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {entryErr && (
                  <p role="alert" className="text-xs text-red-600 w-full -mt-1">
                    {entryErr}
                  </p>
                )}

                {/* Quitar franja */}
                <button
                  type="button"
                  onClick={() => removeEntry(idx)}
                  aria-label={`Quitar horario ${entry.day} ${entry.startTime}`}
                  className="ml-auto w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-100 transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Botón de añadir franja */}
      <button
        type="button"
        onClick={addBlankEntry}
        className={cn(
          'flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl',
          'border-2 border-dashed border-gray-300 text-base font-medium text-gray-600',
          'hover:border-[#0A192F] hover:text-[#0A192F] hover:bg-blue-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A192F]',
          'transition-colors'
        )}
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
        Añadir otro horario
      </button>

      {schedule.length === 0 && (
        <p className="text-sm text-gray-400 pl-1">
          Toca un día de la semana arriba para añadir la primera franja horaria.
        </p>
      )}
    </div>
  );
}

// ── Field helper ────────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-base font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </Label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
