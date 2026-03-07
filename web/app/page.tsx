"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("token"));
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <header className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          The Verified Engineering Network
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl">
          Connect with Waterloo Engineering experts. AI-powered verification ensures
          every profile is a real student or faculty member.
        </p>
      </header>

      {/* Stats / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-[#7E3AF2] font-bold text-3xl mb-1">1.2k+</div>
          <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Verified Experts</div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-[#7E3AF2] font-bold text-3xl mb-1">Eng&apos;28</div>
          <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Top Class Activity</div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-[#7E3AF2] font-bold text-3xl mb-1">99.8%</div>
          <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Bot Protection</div>
        </div>
      </div>

      {/* Action Section - only visible when not logged in */}
      {!loggedIn && (
        <div className="p-10 bg-[#7E3AF2] rounded-3xl text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Ready to join the network?</h2>
            <p className="opacity-80">Grab your WatCard and get started in 30 seconds.</p>
          </div>
          <Link
            href="/verify"
            className="bg-white text-[#7E3AF2] px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition"
          >
            Verify Now
          </Link>
        </div>
      )}
    </div>
  );
}
