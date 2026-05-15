import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WorkshopProvider } from '@/context/WorkshopContext';
import { AuthProvider } from '@/context/AuthContext';
import { FontSizeProvider } from '@/components/FontSizeProvider';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import LoginModal from '@/components/LoginModal';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Pilares Coyuya — Talleres Comunitarios',
  description: 'Plataforma de talleres comunitarios del Centro Pilares Coyuya',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased flex flex-col">
        <FontSizeProvider>
          <AuthProvider>
            <WorkshopProvider>
              <AppHeader />
              <main
                id="main-content"
                className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8"
              >
                {children}
              </main>
              <AppFooter />
              {/* Modal de login — renderizado globalmente, controlado por AuthContext */}
              <LoginModal />
            </WorkshopProvider>
          </AuthProvider>
        </FontSizeProvider>
      </body>
    </html>
  );
}
