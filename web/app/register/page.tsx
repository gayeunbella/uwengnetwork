"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { UserPlus, Eye, EyeOff, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PROGRAMS = [
  "Architectural Engineering",
  "Biomedical Engineering",
  "Chemical Engineering",
  "Civil Engineering",
  "Computer Engineering",
  "Electrical and Computer Engineering",
  "Environmental Engineering",
  "Geological Engineering",
  "Management Engineering",
  "Mechanical Engineering",
  "Mechatronics Engineering",
  "Nanotechnology Engineering",
  "Software Engineering",
  "Systems Design Engineering",
];

const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => `${2025 + i}`);

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [form, setForm] = useState({
    name: searchParams.get("name") || "",
    studentId: searchParams.get("studentId") || "",
    email: "",
    gender: "",
    program: "",
    classOf: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email.endsWith("@uwaterloo.ca")) {
      setError("Please use your @uwaterloo.ca email address");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Map classOf to year (e.g., 2029 grad → currently year 1 in 2025)
      const currentYear = new Date().getFullYear();
      const gradYear = parseInt(form.classOf);
      const yearNum = Math.max(1, Math.min(5, 5 - (gradYear - currentYear)));
      const year = yearNum <= 5 ? String(yearNum) : "grad";

      // 1. Sign up with the backend
      const signupRes = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          department: form.program,
          year,
        }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        setError(signupData.detail || "Signup failed");
        return;
      }

      const token = signupData.access_token;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(signupData.user));

      // 2. Upload WatCard for verification
      const watcardBase64 = sessionStorage.getItem("watcardImage");
      if (watcardBase64) {
        const res = await fetch(watcardBase64);
        const blob = await res.blob();
        const formData = new FormData();
        formData.append("file", blob, "watcard.jpg");

        await fetch(`${API_URL}/api/auth/verify-watcard`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        sessionStorage.removeItem("watcardImage");
      }

      router.push("/");
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name (pre-filled, read-only) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
        <input
          type="text"
          value={form.name}
          readOnly
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
        />
        <p className="text-xs text-slate-400 mt-1">Extracted from your WatCard</p>
      </div>

      {/* Student ID (pre-filled, read-only) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Student ID</label>
        <input
          type="text"
          value={form.studentId}
          readOnly
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
        />
        <p className="text-xs text-slate-400 mt-1">Extracted from your WatCard</p>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">UWaterloo Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@uwaterloo.ca"
          required
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
        <select
          value={form.gender}
          onChange={(e) => update("gender", e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
      </div>

      {/* Program */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Program</label>
        <select
          value={form.program}
          onChange={(e) => update("program", e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white"
        >
          <option value="">Select program</option>
          {PROGRAMS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Class of */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Class Of</label>
        <select
          value={form.classOf}
          onChange={(e) => update("classOf", e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white"
        >
          <option value="">Select graduation year</option>
          {GRAD_YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="At least 8 characters"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            placeholder="Re-enter your password"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all pr-12"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-4 bg-red-50 border border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#7E3AF2] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5" />
            Create Account
          </>
        )}
      </button>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-purple-100 text-[#7E3AF2] rounded-2xl flex items-center justify-center font-bold text-xl">
            2
          </div>
          <div>
            <h2 className="text-2xl font-bold">Complete Registration</h2>
            <p className="text-slate-500">Fill in your details to join the network</p>
          </div>
        </div>

        <Suspense fallback={<div className="text-slate-400 text-center py-8">Loading...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
