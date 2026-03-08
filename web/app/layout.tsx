// src/app/layout.tsx
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F9FAFB] text-slate-900">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}