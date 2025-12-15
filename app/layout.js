import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import BetSlip from "./components/BetSlip";
import BottomNav from "./components/BottomNav";
import { Providers } from "./providers";
import { Toaster } from 'sonner';
import { Suspense } from 'react';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    template: '%s | Rei do Pote',
    default: 'Rei do Pote | O Melhor Bolão Online',
  },
  description: "Dê seus palpites, desafie amigos e suba no ranking. A melhor plataforma de fantasy game de futebol do Brasil.",
  keywords: ['bolão', 'futebol', 'apostas', 'brasileirão', 'champions league', 'fantasy game'],
  authors: [{ name: 'Rei do Pote' }],
  creator: 'Rei do Pote',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://rei-do-pote-vzvb.vercel.app/',
    siteName: 'Rei do Pote',
    title: 'Rei do Pote | O Melhor Bolão Online',
    description: 'Dê seus palpites, desafie amigos e suba no ranking. A melhor plataforma de fantasy game de futebol do Brasil.',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Rei do Pote Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rei do Pote | O Melhor Bolão Online',
    description: 'Prove que você entende de futebol e suba no ranking!',
    images: ['/logo.png'],
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Navbar />
        <div className="app-layout">
          <Providers>
            <Suspense fallback={<div style={{ width: '250px', background: 'var(--card-bg)' }} />}>
              <Sidebar />
            </Suspense>
            <main className="main-content">
              {children}
            </main>
            <BetSlip />
          </Providers>
        </div>
        <BottomNav />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
