import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BolaObr",
  description: "O primeiro mercado de previsão do futebol brasileiro.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Navbar />
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
