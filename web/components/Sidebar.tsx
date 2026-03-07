"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, FlaskConical, MessageCircle, User, LogOut, LogIn, ShieldCheck } from "lucide-react";
import { clearAuth, isLoggedIn } from "@/lib/auth";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col pt-6">
      <div className="px-6 pb-8">
        <Link href="/" className="text-xl font-bold tracking-tighter text-[#7E3AF2]">
          UW <span className="text-slate-900">ENG</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <NavItem href="/" icon={<Compass size={18} />} label="Discover" active={pathname === "/"} />
        <NavItem href="/research" icon={<FlaskConical size={18} />} label="Research & Profs" active={pathname.startsWith("/research")} />
        <NavItem href="/messages" icon={<MessageCircle size={18} />} label="Messages" active={pathname.startsWith("/messages")} />
        <NavItem href="/profile" icon={<User size={18} />} label="Profile" active={pathname.startsWith("/profile")} />

        <div className="pt-4">
          <div className="border-t border-slate-100 pt-4">
            <NavItem href="/verify" icon={<ShieldCheck size={18} />} label="Verification" active={pathname === "/verify"} />
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100">
        {loggedIn ? (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all w-full"
          >
            <LogOut size={18} /> Sign Out
          </button>
        ) : (
          <NavItem href="/login" icon={<LogIn size={18} />} label="Log In" active={false} />
        )}
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-purple-50 text-[#7E3AF2]"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {icon} {label}
    </Link>
  );
}
