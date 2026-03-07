"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { UserPlus, Eye, EyeOff, Loader2, GraduationCap } from "lucide-react";
import { setAuth } from "@/lib/auth";

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

const DEPARTMENTS = [
  "Chemical Engineering",
  "Civil and Environmental Engineering",
  "Electrical and Computer Engineering",
  "Management Sciences",
  "Mechanical and Mechatronics Engineering",
  "Systems Design Engineering",
];

const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => `${2025 + i}`);

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasWatcardData = !!searchParams.get("name");

  const [isProf, setIsProf] = useState(false);
  const [form, setForm] = useState({
    name: searchParams.get("name") || "",
    studentId: searchParams.get("studentId") || "",
    email: "",
    gender: "",
    program: "",
    department: "",
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
      let year = "grad";
      if (!isProf) {
        const currentYear = new Date().getFullYear();
        const gradYear = parseInt(form.classOf);
        const yearNum = Math.max(1, Math.min(5, 5 - (gradYear - currentYear)));
        year = yearNum <= 5 ? String(yearNum) : "grad";
      }

      const signupRes = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          department: isProf ? form.department : form.program,
          year,
        }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        setError(signupData.detail || "Signup failed");
        return;
      }

      const token = signupData.access_token;
      setAuth(token, signupData.user);

      // Upload WatCard for verification (students only)
      if (!isProf) {
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
      }

      router.push("/");
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Role Toggle */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setIsProf(false)}
          className={`flex-1 py-3 rounded-xl font-medium text-sm border transition-all ${
            !isProf
              ? "bg-[#7E3AF2] text-white border-[#7E3AF2]"
              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
          }`}
        >
          Student
        </button>
        <button
          type="button"
          onClick={() => setIsProf(true)}
          className={`flex-1 py-3 rounded-xl font-medium text-sm border transition-all flex items-center justify-center gap-2 ${
            isProf
              ? "bg-[#7E3AF2] text-white border-[#7E3AF2]"
              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Professor
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
          {!isProf && hasWatcardData ? (
            <>
              <input
                type="text"
                value={form.name}
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Extracted from your WatCard</p>
            </>
          ) : (
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
          )}
        </div>

        {/* Student ID - students only */}
        {!isProf && hasWatcardData && (
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
        )}

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

        {/* Program (students) or Department (profs) */}
        {isProf ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
            <select
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white"
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        ) : (
          <>
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
          </>
        )}

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
              {isProf ? "Register as Professor" : "Create Account"}
            </>
          )}
        </button>
      </form>
    </div>
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
