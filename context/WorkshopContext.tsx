'use client';

/**
 * WorkshopContext — fuente única de verdad para todos los talleres.
 * CONECTADO A SUPABASE — todas las operaciones son persistentes.
 *
 * Tabla: workshops (ver init-db.js para el esquema completo)
 * Las columnas en la BD usan snake_case; los tipos TypeScript usan camelCase.
 * Las funciones dbToWorkshop / workshopToDb gestionan la conversión.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  type ScheduleEntry,
  type Workshop,
  type WorkshopFocus,
} from '@/types/workshop';

// ── Mapeo BD (snake_case) ↔ TypeScript (camelCase) ───────────────────────────

type DbRow = Record<string, unknown>;

function dbToWorkshop(row: DbRow): Workshop {
  return {
    id:                   row.id as string,
    instructorName:       row.instructor_name as string,
    instructorLastName:   row.instructor_last_name as string,
    focus:                row.focus as WorkshopFocus,
    workshopName:         row.workshop_name as string,
    description:          row.description as string,
    schedule:             row.schedule as ScheduleEntry[],
    targetAudience:       row.target_audience as string,
    forMinors:            row.for_minors as boolean,
    recommendedAgeRange:  row.recommended_age_range as string,
    requiredMaterials:    row.required_materials as string,
    imageUrl:             row.image_url as string,
  };
}

function workshopToDb(data: Omit<Workshop, 'id'>) {
  return {
    instructor_name:       data.instructorName,
    instructor_last_name:  data.instructorLastName,
    focus:                 data.focus,
    workshop_name:         data.workshopName,
    description:           data.description,
    schedule:              data.schedule,        // jsonb — Supabase lo serializa automáticamente
    target_audience:       data.targetAudience,
    for_minors:            data.forMinors,
    recommended_age_range: data.recommendedAgeRange,
    required_materials:    data.requiredMaterials,
    image_url:             data.imageUrl,
  };
}

// ── Interfaz del contexto ─────────────────────────────────────────────────────

interface WorkshopContextValue {
  workshops: Workshop[];
  isLoading: boolean;           // true mientras carga la lista inicial
  addWorkshop:    (data: Omit<Workshop, 'id'>) => Promise<void>;
  updateWorkshop: (id: string, data: Omit<Workshop, 'id'>) => Promise<void>;
  deleteWorkshop: (id: string) => Promise<void>;
}

const WorkshopContext = createContext<WorkshopContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function WorkshopProvider({ children }: { children: ReactNode }) {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial: SELECT todos los talleres ordenados por fecha de creación
  useEffect(() => {
    async function fetchWorkshops() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[WorkshopContext] Error al cargar talleres:', error.message);
      } else {
        setWorkshops((data ?? []).map(dbToWorkshop));
      }
      setIsLoading(false);
    }

    fetchWorkshops();
  }, []);

  // INSERT — agrega un nuevo taller y lo añade al estado local en éxito
  const addWorkshop = useCallback(async (data: Omit<Workshop, 'id'>) => {
    const { data: row, error } = await supabase
      .from('workshops')
      .insert([workshopToDb(data)])
      .select()
      .single();

    if (error) {
      console.error('[WorkshopContext] Error al crear taller:', error.message);
      return;
    }
    if (row) setWorkshops((prev) => [...prev, dbToWorkshop(row)]);
  }, []);

  // UPDATE — modifica un taller existente por ID
  const updateWorkshop = useCallback(async (id: string, data: Omit<Workshop, 'id'>) => {
    const { data: row, error } = await supabase
      .from('workshops')
      .update(workshopToDb(data))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[WorkshopContext] Error al actualizar taller:', error.message);
      return;
    }
    if (row) {
      setWorkshops((prev) =>
        prev.map((w) => (w.id === id ? dbToWorkshop(row) : w))
      );
    }
  }, []);

  // DELETE — elimina un taller por ID
  const deleteWorkshop = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('workshops')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[WorkshopContext] Error al eliminar taller:', error.message);
      return;
    }
    setWorkshops((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return (
    <WorkshopContext.Provider
      value={{ workshops, isLoading, addWorkshop, updateWorkshop, deleteWorkshop }}
    >
      {children}
    </WorkshopContext.Provider>
  );
}

export function useWorkshops(): WorkshopContextValue {
  const ctx = useContext(WorkshopContext);
  if (!ctx) throw new Error('useWorkshops must be used inside WorkshopProvider');
  return ctx;
}
