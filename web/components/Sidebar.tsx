// src/components/Sidebar.tsx
import Link from 'next/link';
import { Home, ShieldCheck, Search, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col pt-6">
      <div className="px-6 pb-8">
        <span className="text-xl font-bold tracking-tighter text-[#7E3AF2]">
          UW <span className="text-slate-900">ENG</span>
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <NavItem href="/" icon={<Home size={18} />} label="Overview" active />
        <NavItem href="/directory" icon={<Search size={18} />} label="Expert Directory" />
        <NavItem href="/verify" icon={<ShieldCheck size={18} />} label="Verification" />
      </nav>

      <div className="p-4 border-t border-slate-100">
        <NavItem href="/logout" icon={<LogOut size={18} />} label="Sign Out" />
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active = false }: any) {
  return (
    <Link href={href} className={`
      flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
      ${active ? 'bg-purple-50 text-[#7E3AF2]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
    `}>
      {icon} {label}
    </Link>
  );
}