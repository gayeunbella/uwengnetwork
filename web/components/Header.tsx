"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, isLoggedIn } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const handler = () => setLoggedIn(isLoggedIn());
    window.addEventListener("auth-change", handler);
    return () => window.removeEventListener("auth-change", handler);
  }, []);

  const handleSignOut = () => {
    clearAuth();
    router.push("/");
  };

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-50">

      <div className="flex gap-8 items-center text-sm font-medium text-slate-600 ml-auto">
        <Link href="/about" className="hover:text-[#5D0096] transition">
          About
        </Link>
        {loggedIn ? (
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
          >
            Sign Out
          </button>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-[#5D0096] text-white hover:bg-[#865DA4] transition"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
