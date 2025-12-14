import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { Toaster } from 'sonner';

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
        <main className="container">
          {children}
        </main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
