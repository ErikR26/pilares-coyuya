'use client';

/**
 * WorkshopContext — fuente única de verdad para todos los talleres.
 *
 * ESTADO ACTUAL → en memoria (React useState + datos semilla).
 * La firma pública del contexto NO cambiará al conectar Supabase;
 * solo cambia la implementación interna de cada función CRUD.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * GUÍA DE INTEGRACIÓN CON SUPABASE — 4 pasos
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * PASO 0 — Instalar el cliente oficial:
 *   npm install @supabase/supabase-js @supabase/ssr
 *
 * PASO 1 — Crear lib/supabase/client.ts:
 *   import { createBrowserClient } from '@supabase/ssr'
 *   export const supabase = createBrowserClient(
 *     process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 *   )
 *
 * PASO 2 — Crear las tablas en Supabase (SQL Editor):
 *   CREATE TABLE workshops (
 *     id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     data        jsonb NOT NULL,           -- Almacena el objeto Workshop completo
 *     created_at  timestamptz DEFAULT now()
 *   );
 *   -- O bien una tabla normalizada con columnas separadas por campo.
 *
 * PASO 3 — En WorkshopProvider (marcado con ▶ SUPABASE abajo):
 *   Reemplaza cada función CRUD con la llamada al cliente de Supabase.
 *
 * PASO 4 — En AuthContext.tsx ya están los TODOs para login/logout.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SEED_WORKSHOPS, type Workshop } from '@/types/workshop';

// ▶ SUPABASE — PASO 3a: descomenta esta línea al conectar la base de datos
// import { supabase } from '@/lib/supabase/client';

interface WorkshopContextValue {
  workshops: Workshop[];
  addWorkshop: (data: Omit<Workshop, 'id'>) => void;
  updateWorkshop: (id: string, data: Omit<Workshop, 'id'>) => void;
  deleteWorkshop: (id: string) => void;
}

const WorkshopContext = createContext<WorkshopContextValue | null>(null);

export function WorkshopProvider({ children }: { children: ReactNode }) {
  // ▶ SUPABASE — PASO 3b: reemplaza SEED_WORKSHOPS con una carga inicial desde Supabase.
  //   Cambia useState por un useEffect que llame a:
  //
  //   useEffect(() => {
  //     supabase.from('workshops').select('*').then(({ data }) => {
  //       if (data) setWorkshops(data as Workshop[]);
  //     });
  //   }, []);
  //
  //   Y cambia el estado inicial a: useState<Workshop[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>(SEED_WORKSHOPS);

  // ▶ SUPABASE — PASO 3c: reemplaza el cuerpo de addWorkshop con:
  //
  //   const { data, error } = await supabase
  //     .from('workshops')
  //     .insert([{ ...workshopData, id: uuidv4() }])
  //     .select()
  //     .single();
  //   if (!error && data) setWorkshops(prev => [...prev, data as Workshop]);
  //
  //   Nota: convierte la función a async y ajusta el tipo en la interfaz.
  const addWorkshop = useCallback((data: Omit<Workshop, 'id'>) => {
    setWorkshops((prev) => [...prev, { ...data, id: uuidv4() }]);
  }, []);

  // ▶ SUPABASE — PASO 3d: reemplaza el cuerpo de updateWorkshop con:
  //
  //   const { error } = await supabase
  //     .from('workshops')
  //     .update({ ...workshopData })
  //     .eq('id', id);
  //   if (!error) setWorkshops(prev => prev.map(w => w.id === id ? { ...workshopData, id } : w));
  const updateWorkshop = useCallback((id: string, data: Omit<Workshop, 'id'>) => {
    setWorkshops((prev) =>
      prev.map((w) => (w.id === id ? { ...data, id } : w))
    );
  }, []);

  // ▶ SUPABASE — PASO 3e: reemplaza el cuerpo de deleteWorkshop con:
  //
  //   const { error } = await supabase
  //     .from('workshops')
  //     .delete()
  //     .eq('id', id);
  //   if (!error) setWorkshops(prev => prev.filter(w => w.id !== id));
  const deleteWorkshop = useCallback((id: string) => {
    setWorkshops((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return (
    <WorkshopContext.Provider
      value={{ workshops, addWorkshop, updateWorkshop, deleteWorkshop }}
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
