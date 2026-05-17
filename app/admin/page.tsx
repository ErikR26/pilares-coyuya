'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  Pencil,
  Trash2,
  Calendar,
  Users,
  ShieldOff,
  ArrowLeft,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkshops } from '@/context/WorkshopContext';
import { useAuth } from '@/context/AuthContext';
import WorkshopForm from '@/components/admin/WorkshopForm';
import { FOCUS_COLORS, type Workshop } from '@/types/workshop';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const { isAuthenticated, isAuthLoading, openLogin } = useAuth();
  const { workshops, isLoading: wsLoading, addWorkshop, updateWorkshop, deleteWorkshop } = useWorkshops();
  const router = useRouter();

  const [formTarget,    setFormTarget]    = useState<Workshop | null | 'new'>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [adminQuery,    setAdminQuery]    = useState('');

  // ── Filtrado reactivo — debe ir antes de cualquier early return ────────────
  const filtered = useMemo(() => {
    const q = adminQuery.toLowerCase().trim();
    if (!q) return workshops;
    return workshops.filter(
      (w) =>
        w.workshopName.toLowerCase().includes(q) ||
        w.instructorName.toLowerCase().includes(q) ||
        w.instructorLastName.toLowerCase().includes(q)
    );
  }, [workshops, adminQuery]);

  // ── Guardia: espera a que Supabase restaure la sesión ─────────────────────
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-gray-400 text-lg">
        <span className="w-6 h-6 border-2 border-gray-300 border-t-[#0A192F] rounded-full animate-spin" aria-hidden="true" />
        Verificando sesión…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AccessDenied onLogin={openLogin} onBack={() => router.push('/')} />;
  }

  const isFormOpen      = formTarget !== null;
  const editingWorkshop = formTarget !== 'new' ? (formTarget as Workshop | null) : null;

  function handleSave(data: Omit<Workshop, 'id'>) {
    if (formTarget === 'new') {
      addWorkshop(data);
    } else if (formTarget) {
      updateWorkshop((formTarget as Workshop).id, data);
    }
    setFormTarget(null);
  }

  function handleDeleteConfirm(id: string) {
    deleteWorkshop(id);
    setConfirmDelete(null);
  }

  return (
    <>
      {/* Heading */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0A192F]">
            Panel Administrador
          </h1>
          <p className="text-lg text-gray-600 mt-1">
            {workshops.length} taller{workshops.length !== 1 ? 'es' : ''} registrado{workshops.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setFormTarget('new')}
          className="min-h-[52px] text-lg px-8 bg-[#0A192F] hover:bg-[#172a46] text-white rounded-xl gap-2"
        >
          <PlusCircle className="w-5 h-5" aria-hidden="true" />
          Crear Nuevo Taller
        </Button>
      </div>

      {/* Barra de búsqueda predictiva */}
      <div className="relative mb-6">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={adminQuery}
          onChange={(e) => setAdminQuery(e.target.value)}
          placeholder="Buscar por nombre de taller o instructor…"
          aria-label="Filtrar talleres del panel"
          className="w-full pl-12 pr-12 h-14 text-lg border-2 border-gray-200 focus:border-[#0A192F] focus:outline-none focus:ring-2 focus:ring-[#0A192F]/20 rounded-xl text-gray-900 placeholder:text-gray-400 bg-white transition-colors"
        />
        {adminQuery && (
          <button
            onClick={() => setAdminQuery('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Contador de resultados cuando hay filtro activo */}
      {adminQuery && (
        <p className="text-base text-gray-500 mb-4" aria-live="polite">
          {filtered.length === 0
            ? 'Sin resultados para esa búsqueda.'
            : `${filtered.length} taller${filtered.length !== 1 ? 'es' : ''} encontrado${filtered.length !== 1 ? 's' : ''}.`}
        </p>
      )}

      {/* Workshop list */}
      {workshops.length === 0 ? (
        <div className="text-center py-24 text-gray-400 text-xl">
          No hay talleres registrados. ¡Crea el primero!
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400 text-xl">
          No coincide ningún taller con tu búsqueda.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ws) => {
            const colors = FOCUS_COLORS[ws.focus];
            return (
              <article
                key={ws.id}
                className={cn(
                  'rounded-2xl border-2 bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm',
                  colors.border
                )}
              >
                {/* Color accent strip */}
                <div
                  className={cn(
                    'hidden sm:block w-1.5 self-stretch rounded-full shrink-0',
                    colors.pill.split(' ')[0]
                  )}
                  aria-hidden="true"
                />

                {/* Main info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn('text-sm font-semibold', colors.pill)}>
                      {ws.focus}
                    </Badge>
                    {ws.forMinors && (
                      <Badge variant="outline" className="text-sm border-gray-300 text-gray-600">
                        Menores
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {ws.workshopName}
                  </h2>
                  <p className="text-base text-gray-600 font-medium">
                    {ws.instructorName} {ws.instructorLastName}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-1">
                    <span className="flex items-start gap-1.5">
                      <Calendar className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                      <span>
                        {ws.schedule.map((e) => `${e.day} ${e.startTime}–${e.endTime}`).join(' · ')}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" aria-hidden="true" />
                      {ws.targetAudience}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setFormTarget(ws)}
                    className="min-h-[48px] min-w-[48px] text-base gap-2 border-2 border-gray-300 hover:border-[#0A192F] hover:text-[#0A192F]"
                    aria-label={`Editar taller ${ws.workshopName}`}
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDelete(ws.id)}
                    className="min-h-[48px] min-w-[48px] text-base gap-2 border-2 border-red-200 text-red-600 hover:border-red-500 hover:bg-red-50"
                    aria-label={`Eliminar taller ${ws.workshopName}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create/Edit form dialog */}
      {isFormOpen && (
        <WorkshopForm
          workshop={editingWorkshop}
          onSave={handleSave}
          onClose={() => setFormTarget(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <ConfirmDeleteDialog
          workshopName={workshops.find((w) => w.id === confirmDelete)?.workshopName ?? ''}
          onConfirm={() => handleDeleteConfirm(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}

// ── Pantalla de acceso denegado ───────────────────────────────────────────────

function AccessDenied({ onLogin, onBack }: { onLogin: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
        <ShieldOff className="w-10 h-10 text-red-500" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Acceso Restringido</h1>
        <p className="text-lg text-gray-500 max-w-md">
          Esta sección es exclusiva para administradores.
          Inicia sesión con tus credenciales para continuar.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="min-h-[52px] text-lg px-8 border-2 gap-2"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          Volver al inicio
        </Button>
        <Button
          onClick={onLogin}
          className="min-h-[52px] text-lg px-8 bg-[#0A192F] hover:bg-[#172a46] text-white gap-2"
        >
          Iniciar Sesión
        </Button>
      </div>
    </div>
  );
}

// ── Diálogo de confirmación de eliminación ────────────────────────────────────

function ConfirmDeleteDialog({
  workshopName,
  onConfirm,
  onCancel,
}: {
  workshopName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
            <Trash2 className="w-6 h-6 text-red-600" aria-hidden="true" />
          </div>
          <h2 id="confirm-title" className="text-2xl font-bold text-gray-900">
            Eliminar taller
          </h2>
        </div>
        <p className="text-lg text-gray-600">
          ¿Estás seguro de que deseas eliminar{' '}
          <strong className="text-gray-900">&ldquo;{workshopName}&rdquo;</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 min-h-[52px] text-lg border-2"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 min-h-[52px] text-lg bg-red-600 hover:bg-red-700 text-white"
          >
            Sí, eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
