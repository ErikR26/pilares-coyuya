import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    /**
     * Comodín hostname: '**' permite que <Image /> de Next.js cargue
     * cualquier URL de imagen HTTPS que el administrador ingrese en el formulario,
     * sin necesidad de declarar cada dominio manualmente.
     *
     * Nota de seguridad: en entornos de alta seguridad puedes reemplazar
     * el comodín por dominios específicos (ej. images.unsplash.com) para
     * limitar el origen de las imágenes a fuentes confiables.
     */
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
