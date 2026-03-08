"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, FlaskConical, MessageCircle, User, LogOut, LogIn, FolderOpen, GraduationCap, MessagesSquare } from "lucide-react";
import { clearAuth, isLoggedIn } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const update = () => setLoggedIn(isLoggedIn());
    update();
    window.addEventListener("auth-change", update);
    return () => window.removeEventListener("auth-change", update);
  }, []);

  // Poll unread notifications every 30s
  useEffect(() => {
    if (!loggedIn) { setUnreadCount(0); return; }

    const fetchUnread = () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      fetch(`${API_URL}/api/notifications?unread=true&page_size=1`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setUnreadCount(data.unread_count ?? 0); })
        .catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [loggedIn]);

  // Clear badge when on notifications page
  useEffect(() => {
    if (pathname === "/notifications") setUnreadCount(0);
  }, [pathname]);

  const handleSignOut = () => {
    clearAuth();
    router.push("/landing");
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col pt-6">
      <div className="px-6 pb-8">
        <Link href="/landing" className="text-xl font-bold tracking-tighter text-[#5D0096]">
          UW Eng<span className="text-slate-900"> Network</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <NavItem href="/" icon={<Compass size={18} />} label="Discover" active={pathname === "/"} />
        <NavItem href="/projects" icon={<FolderOpen size={18} />} label="Projects" active={pathname.startsWith("/projects")} />
        <NavItem href="/research" icon={<FlaskConical size={18} />} label="Research" active={pathname.startsWith("/research")} />
        <NavItem href="/community" icon={<MessagesSquare size={18} />} label="Community" active={pathname.startsWith("/community")} />
        <NavItem href="/professors" icon={<GraduationCap size={18} />} label="Professors" active={pathname.startsWith("/professors")} />
        <NavItem href="/messages" icon={<MessageCircle size={18} />} label="Messages" active={pathname.startsWith("/messages")} />
        <NavItem href="/profile" icon={<User size={18} />} label="Profile" active={pathname.startsWith("/profile")} />

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
          <NavItem href="/login" icon={<LogIn size={18} />} label="Sign In" active={false} />
        )}
      </div>
    </aside>
  );
}

function NavItem({
  href, icon, label, active, badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-purple-50 text-[#5D0096]"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="min-w-[20px] h-5 rounded-full bg-[#7E3AF2] text-white text-xs flex items-center justify-center px-1.5 font-medium">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
