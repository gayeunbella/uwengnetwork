"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { isLoggedIn } from "@/lib/auth";

// Pages that don't require auth and hide the sidebar
const PUBLIC_PATHS = ["/landing", "/login", "/register", "/verify"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (!isPublic && !isLoggedIn()) {
      router.replace("/landing");
    }
  }, [pathname, isPublic, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-slate-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
