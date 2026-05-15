/**
 * init-db.js — Script de inicialización de la base de datos Supabase.
 *
 * Crea la tabla 'workshops', activa RLS y configura las políticas de seguridad.
 * Es idempotente: puede ejecutarse varias veces sin duplicar tablas ni políticas.
 *
 * USO:
 *   1. Asegúrate de que .env.local tiene SUPABASE_DB_URL con tu connection string.
 *   2. Ejecuta:  node init-db.js
 *   3. Para incluir los 4 talleres de ejemplo:  node init-db.js --seed
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const DB_URL = process.env.SUPABASE_DB_URL;
const SEED   = process.argv.includes('--seed');

if (!DB_URL) {
  console.error('\n❌  Falta la variable SUPABASE_DB_URL en .env.local');
  console.error('   Encuéntrala en: supabase.com → Settings → Database → Connection string → URI\n');
  process.exit(1);
}

// ── SQL ───────────────────────────────────────────────────────────────────────

const SQL_CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS workshops (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_name       text        NOT NULL,
  instructor_last_name  text        NOT NULL,
  focus                 text        NOT NULL,
  workshop_name         text        NOT NULL,
  description           text        NOT NULL,
  schedule              jsonb       NOT NULL DEFAULT '[]',
  target_audience       text        NOT NULL,
  for_minors            boolean     NOT NULL DEFAULT false,
  recommended_age_range text        NOT NULL,
  required_materials    text        NOT NULL,
  image_url             text        NOT NULL DEFAULT '',
  created_at            timestamptz NOT NULL DEFAULT now()
);
`;

const SQL_RLS = `
-- Activa Row Level Security en la tabla
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

-- Política 1: lectura pública (cualquier usuario de internet puede ver los talleres)
DROP POLICY IF EXISTS "public_select" ON workshops;
CREATE POLICY "public_select" ON workshops
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política 2: inserción solo para usuarios autenticados con email/contraseña
DROP POLICY IF EXISTS "auth_insert" ON workshops;
CREATE POLICY "auth_insert" ON workshops
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política 3: actualización solo para usuarios autenticados
DROP POLICY IF EXISTS "auth_update" ON workshops;
CREATE POLICY "auth_update" ON workshops
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política 4: eliminación solo para usuarios autenticados
DROP POLICY IF EXISTS "auth_delete" ON workshops;
CREATE POLICY "auth_delete" ON workshops
  FOR DELETE
  TO authenticated
  USING (true);
`;

const SEED_WORKSHOPS = [
  {
    instructor_name: 'María', instructor_last_name: 'González',
    focus: 'Ciberescuela', workshop_name: 'Introducción a la Computación',
    description: 'Aprende a usar el computador desde cero: correo electrónico, navegación web y herramientas básicas de oficina.',
    schedule: [{ day: 'Lunes', startTime: '09:00', endTime: '11:00' }, { day: 'Miércoles', startTime: '09:00', endTime: '11:00' }],
    target_audience: 'Adultos mayores sin experiencia previa en tecnología',
    for_minors: false, recommended_age_range: '55 – 80 años',
    required_materials: 'Ninguno. Los equipos son provistos por el centro.',
    image_url: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=600&q=80',
  },
  {
    instructor_name: 'Carlos', instructor_last_name: 'Reyes',
    focus: 'Ponte Pila', workshop_name: 'Yoga y Equilibrio',
    description: 'Sesiones de yoga suave para mejorar el equilibrio, la flexibilidad y el bienestar mental.',
    schedule: [{ day: 'Martes', startTime: '08:00', endTime: '09:30' }, { day: 'Jueves', startTime: '08:00', endTime: '09:30' }, { day: 'Sábado', startTime: '10:00', endTime: '12:00' }],
    target_audience: 'Adultos mayores con o sin experiencia previa en yoga',
    for_minors: false, recommended_age_range: '60 – 90 años',
    required_materials: 'Ropa cómoda y mat de yoga (se prestan en el centro).',
    image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
  },
  {
    instructor_name: 'Ana', instructor_last_name: 'Morales',
    focus: 'Cultural', workshop_name: 'Taller de Pintura Acuarela',
    description: 'Explora el arte de la acuarela con técnicas básicas e intermedias.',
    schedule: [{ day: 'Viernes', startTime: '14:00', endTime: '17:00' }],
    target_audience: 'Toda la comunidad, con preferencia para adultos mayores',
    for_minors: true, recommended_age_range: '12 años en adelante',
    required_materials: 'Set de acuarelas, 2 pinceles, papel acuarela tamaño carta.',
    image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80',
  },
  {
    instructor_name: 'Roberto', instructor_last_name: 'Fuentes',
    focus: 'Actividad Económica', workshop_name: 'Emprendimiento Digital',
    description: 'Aprende a crear y gestionar un pequeño negocio en línea.',
    schedule: [{ day: 'Lunes', startTime: '15:00', endTime: '17:00' }, { day: 'Viernes', startTime: '10:00', endTime: '12:00' }],
    target_audience: 'Adultos interesados en generar ingresos desde casa',
    for_minors: false, recommended_age_range: '35 – 75 años',
    required_materials: 'Smartphone con acceso a internet.',
    image_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80',
  },
];

// ── Ejecución ─────────────────────────────────────────────────────────────────

async function main() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    console.log('\n🔌  Conectando a Supabase…');
    await client.connect();
    console.log('✅  Conexión establecida.\n');

    console.log('📋  Creando tabla workshops…');
    await client.query(SQL_CREATE_TABLE);
    console.log('✅  Tabla lista.\n');

    console.log('🔒  Configurando RLS y políticas de seguridad…');
    await client.query(SQL_RLS);
    console.log('✅  Políticas aplicadas:');
    console.log('     • SELECT  → público (anon + authenticated)');
    console.log('     • INSERT  → solo usuarios autenticados');
    console.log('     • UPDATE  → solo usuarios autenticados');
    console.log('     • DELETE  → solo usuarios autenticados\n');

    if (SEED) {
      console.log('🌱  Insertando talleres de ejemplo…');
      for (const ws of SEED_WORKSHOPS) {
        await client.query(
          `INSERT INTO workshops
            (instructor_name, instructor_last_name, focus, workshop_name, description,
             schedule, target_audience, for_minors, recommended_age_range, required_materials, image_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [ws.instructor_name, ws.instructor_last_name, ws.focus, ws.workshop_name,
           ws.description, JSON.stringify(ws.schedule), ws.target_audience,
           ws.for_minors, ws.recommended_age_range, ws.required_materials, ws.image_url]
        );
        console.log(`   ✓  ${ws.workshop_name}`);
      }
      console.log('✅  Datos de ejemplo insertados.\n');
    }

    console.log('🎉  Base de datos inicializada correctamente.\n');
  } catch (err) {
    console.error('\n❌  Error durante la inicialización:', err.message);
    console.error('   Verifica que SUPABASE_DB_URL en .env.local sea correcto.\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
