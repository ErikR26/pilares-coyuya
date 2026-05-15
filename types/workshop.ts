export type WorkshopFocus =
  | 'Ciberescuela'
  | 'Ponte Pila'
  | 'Cultural'
  | 'Actividad Económica';

export type WeekDay =
  | 'Lunes'
  | 'Martes'
  | 'Miércoles'
  | 'Jueves'
  | 'Viernes'
  | 'Sábado'
  | 'Domingo';

/** Un bloque horario independiente por día */
export interface ScheduleEntry {
  day: WeekDay;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface Workshop {
  id: string;
  instructorName: string;
  instructorLastName: string;
  focus: WorkshopFocus;
  workshopName: string;
  description: string;
  /** Reemplaza los antiguos campos days / startTime / endTime.
   *  Cada entrada define un horario independiente por día.
   *  Para conectar a BD: mapear a una tabla 'workshop_schedules' con FK. */
  schedule: ScheduleEntry[];
  targetAudience: string;
  forMinors: boolean;
  recommendedAgeRange: string;
  requiredMaterials: string;
  imageUrl: string;
}

export const FOCUS_COLORS: Record<
  WorkshopFocus,
  { bg: string; text: string; border: string; pill: string }
> = {
  'Ciberescuela':        { bg: 'bg-blue-100',   text: 'text-blue-900',   border: 'border-blue-300',   pill: 'bg-blue-700 hover:bg-blue-800 text-white' },
  'Ponte Pila':          { bg: 'bg-green-100',  text: 'text-green-900',  border: 'border-green-300',  pill: 'bg-green-700 hover:bg-green-800 text-white' },
  'Cultural':            { bg: 'bg-amber-100',  text: 'text-amber-900',  border: 'border-amber-300',  pill: 'bg-amber-600 hover:bg-amber-700 text-white' },
  'Actividad Económica': { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300', pill: 'bg-purple-700 hover:bg-purple-800 text-white' },
};

export const ALL_FOCUSES: WorkshopFocus[] = [
  'Ciberescuela',
  'Ponte Pila',
  'Cultural',
  'Actividad Económica',
];

export const ALL_DAYS: WeekDay[] = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo',
];

export const SEED_WORKSHOPS: Workshop[] = [
  {
    id: 'seed-001',
    instructorName: 'María',
    instructorLastName: 'González',
    focus: 'Ciberescuela',
    workshopName: 'Introducción a la Computación',
    description: 'Aprende a usar el computador desde cero: correo electrónico, navegación web y herramientas básicas de oficina.',
    schedule: [
      { day: 'Lunes',      startTime: '09:00', endTime: '11:00' },
      { day: 'Miércoles',  startTime: '09:00', endTime: '11:00' },
    ],
    targetAudience: 'Adultos mayores sin experiencia previa en tecnología',
    forMinors: false,
    recommendedAgeRange: '55 – 80 años',
    requiredMaterials: 'Ninguno. Los equipos son provistos por el centro.',
    imageUrl: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=600&q=80',
  },
  {
    id: 'seed-002',
    instructorName: 'Carlos',
    instructorLastName: 'Reyes',
    focus: 'Ponte Pila',
    workshopName: 'Yoga y Equilibrio',
    description: 'Sesiones de yoga suave orientadas a mejorar el equilibrio, la flexibilidad y el bienestar mental en adultos mayores.',
    schedule: [
      { day: 'Martes',  startTime: '08:00', endTime: '09:30' },
      { day: 'Jueves',  startTime: '08:00', endTime: '09:30' },
      { day: 'Sábado',  startTime: '10:00', endTime: '12:00' },
    ],
    targetAudience: 'Adultos mayores con o sin experiencia previa en yoga',
    forMinors: false,
    recommendedAgeRange: '60 – 90 años',
    requiredMaterials: 'Ropa cómoda y mat de yoga (se prestan en el centro).',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
  },
  {
    id: 'seed-003',
    instructorName: 'Ana',
    instructorLastName: 'Morales',
    focus: 'Cultural',
    workshopName: 'Taller de Pintura Acuarela',
    description: 'Explora el arte de la acuarela con técnicas básicas e intermedias. Un espacio para la creatividad y la expresión personal.',
    schedule: [
      { day: 'Viernes', startTime: '14:00', endTime: '17:00' },
    ],
    targetAudience: 'Toda la comunidad, con preferencia para adultos mayores',
    forMinors: true,
    recommendedAgeRange: '12 años en adelante',
    requiredMaterials: 'Set de acuarelas, 2 pinceles (fino y mediano), papel acuarela tamaño carta.',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80',
  },
  {
    id: 'seed-004',
    instructorName: 'Roberto',
    instructorLastName: 'Fuentes',
    focus: 'Actividad Económica',
    workshopName: 'Emprendimiento Digital',
    description: 'Aprende a crear y gestionar un pequeño negocio en línea: redes sociales, catálogos digitales y pagos electrónicos.',
    schedule: [
      { day: 'Lunes',   startTime: '15:00', endTime: '17:00' },
      { day: 'Viernes', startTime: '10:00', endTime: '12:00' },
    ],
    targetAudience: 'Adultos interesados en generar ingresos desde casa',
    forMinors: false,
    recommendedAgeRange: '35 – 75 años',
    requiredMaterials: 'Smartphone con acceso a internet.',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80',
  },
];
