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
  title: "Rei do Pote",
  description: "Market prediction platform",
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
