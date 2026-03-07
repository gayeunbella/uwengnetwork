// src/components/Navbar.tsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* Brand matches the "UW Eng Network" purple in your screenshot */}
      <div className="font-bold text-xl tracking-tight text-[#7E3AF2]">
        UW Eng Network
      </div>
      
      <div className="flex gap-8 items-center text-sm font-medium text-slate-600">
        <Link href="/about" className="hover:text-[#7E3AF2] transition">About</Link>
        <Link href="/login" className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
          Log in
        </Link>
        <Link href="/verify" className="px-4 py-2 rounded-lg bg-[#7E3AF2] text-white hover:bg-[#6C2BD9] transition">
          Join Network
        </Link>
      </div>
    </nav>
  );
}