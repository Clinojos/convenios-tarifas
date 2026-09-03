import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext"; // 👈 agregar este import

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins", 
});

export const metadata: Metadata = {
  title: "Convenios y Tarifas – Clinojos",
  description: "Dashboard de Convenios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={poppins.variable}>
      <body className="font-sans antialiased">
        <AuthProvider> {/* 👈 abrir aquí */}
          {children}
          <Toaster 
            richColors 
            position="bottom-right" 
            expand={false}
            visibleToasts={3}
            toastOptions={{
              className: "animate-in slide-in-from-right-4 fade-in duration-300", 
              style: {
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '16px',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                maxWidth: '350px',
              },
              classNames: {
                toast: "gap-3",
                title: "font-sans antialiased text-[11px] font-semibold text-slate-500 tracking-normal normal-case",
                description: "font-sans antialiased text-[13px] font-bold text-slate-900 mt-0.5",
                icon: "scale-110", 
              }
            }}
          />
        </AuthProvider> {/* 👈 cerrar aquí */}
      </body>
    </html>
  );
}