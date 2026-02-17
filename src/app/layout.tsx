import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/layout/Sidebar";
import { auth } from "@/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VacaPlanner - Gestione Ferie Aziendale",
  description: "Sistema di gestione ferie per team aziendale",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="it">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider session={session}>
          {session ? (
            <div className="flex min-h-screen bg-gray-50 dark:bg-black">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          ) : (
            children
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
