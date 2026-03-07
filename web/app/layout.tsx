// src/app/layout.tsx
import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-slate-900">
        <nav className="flex items-center justify-between px-8 py-4 bg-white border-b sticky top-0 z-50">
          <div className="font-bold text-xl tracking-tight text-purple-700">
            UW Eng Network
          </div>
          <div className="flex gap-6 font-medium text-sm">
            <Link href="/" className="hover:text-purple-600">Home</Link>
            <Link href="/verify" className="hover:text-purple-600">Verify</Link>
            <Link href="/directory" className="hover:text-purple-600">Directory</Link>
          </div>
        </nav>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}