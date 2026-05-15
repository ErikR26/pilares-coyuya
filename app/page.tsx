import { Suspense } from 'react';
import PublicView from '@/components/PublicView';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-lg text-gray-500">Cargando talleres…</div>}>
      <PublicView />
    </Suspense>
  );
}
