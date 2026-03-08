"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, LogOut, ArrowLeft, CheckCircle } from "lucide-react";
import { clearAuth, setAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEPARTMENTS = [
  "Biomedical Engineering",
  "Chemical Engineering",
  "Civil and Environmental Engineering",
  "Electrical and Computer Engineering",
  "Management Engineering",
  "Mechanical and Mechatronics Engineering",
  "Nanotechnology Engineering",
  "Software Engineering",
  "Systems Design Engineering",
  "Architecture",
];

const YEARS = ["1", "2", "3", "4", "5", "grad"];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  const [form, setForm] = useState({
    name: "",
    department: "",
    year: "",
    bio: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token || !stored) { setNotLoggedIn(true); return; }
    try {
      const user = JSON.parse(stored);
      setForm({
        name: user.name || "",
        department: user.department || "",
        year: user.year || "",
        bio: user.bio || "",
      });
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name || undefined,
          department: form.department || undefined,
          year: form.year || undefined,
          bio: form.bio || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Failed to save changes");
        return;
      }

      const updatedUser = await res.json();
      // Update localStorage with fresh data
      const stored = localStorage.getItem("user");
      if (stored) {
        const existing = JSON.parse(stored);
        setAuth(token, { ...existing, ...updatedUser });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  if (notLoggedIn) return (
    <div className="text-center py-20">
      <p className="text-slate-500 font-medium">Log in to access settings</p>
      <Link href="/login" className="text-[#7E3AF2] text-sm font-medium hover:underline mt-2 inline-block">Log In</Link>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft size={16} />
        Back to Profile
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Update your profile information</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Display Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white text-sm"
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Year</label>
            <div className="flex gap-2 flex-wrap">
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setForm({ ...form, year: y })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.year === y
                      ? "bg-[#7E3AF2] text-white border-[#7E3AF2]"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {y === "grad" ? "Grad" : `Year ${y}`}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell the community what you're working on or interested in..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none text-sm"
            />
            <p className="text-xs text-slate-400 text-right mt-1">{form.bio.length}/500</p>
          </div>

          {error && (
            <div className="rounded-xl p-4 bg-red-50 border border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {saved && (
            <div className="rounded-xl p-4 bg-green-50 border border-green-200 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <p className="text-green-700 text-sm font-medium">Changes saved!</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7E3AF2] text-white py-3 rounded-xl font-medium text-sm hover:bg-[#6D28D9] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={16} /> Save Changes</>
            )}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Account</h3>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors border border-slate-200 hover:border-red-200 px-4 py-2.5 rounded-lg"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
