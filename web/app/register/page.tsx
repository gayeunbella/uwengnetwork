"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Upload, X, Loader2, CheckCircle, XCircle,
  GraduationCap, UserPlus, Eye, EyeOff,
} from "lucide-react";
import { setAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PROGRAMS = [
  "Architectural Engineering", "Biomedical Engineering", "Chemical Engineering",
  "Civil Engineering", "Computer Engineering", "Electrical and Computer Engineering",
  "Environmental Engineering", "Geological Engineering", "Management Engineering",
  "Mechanical Engineering", "Mechatronics Engineering", "Nanotechnology Engineering",
  "Software Engineering", "Systems Design Engineering",
];

const DEPARTMENTS = [
  "Chemical Engineering", "Civil and Environmental Engineering",
  "Electrical and Computer Engineering", "Management Sciences",
  "Mechanical and Mechatronics Engineering", "Systems Design Engineering",
];

const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => `${2025 + i}`);

type AnalysisResult = {
  isWatCard: boolean;
  isEngineering: boolean;
  faculty: string | null;
  name: string | null;
  studentId: string | null;
  confidence: string;
  reason: string;
};

export default function RegisterPage() {
  const router = useRouter();

  // Role toggle
  const [role, setRole] = useState<"student" | "professor">("student");

  // Step: "verify" (WatCard upload) → "register" (fill details)
  const [step, setStep] = useState<"verify" | "register">("verify");

  // WatCard state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Registration form state
  const [form, setForm] = useState({
    name: "", studentId: "", email: "", gender: "",
    program: "", department: "", classOf: "",
    password: "", confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  const verified = result?.isWatCard && result?.isEngineering;

  // --- WatCard handlers ---

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setVerifyError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setVerifyError(null);
  };

  const handleVerify = async () => {
    if (!file) return;
    setVerifying(true);
    setVerifyError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/verify", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Verification failed");
      } else {
        setResult(data);
        if (data.isWatCard && data.isEngineering) {
          // Auto-advance to register step
          setForm((prev) => ({
            ...prev,
            name: data.name || "",
            studentId: data.studentId || "",
          }));
          setStep("register");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } catch {
      setVerifyError("Failed to connect to server");
    } finally {
      setVerifying(false);
    }
  };


  // --- Registration handler ---

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setRegError(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.endsWith("@uwaterloo.ca")) {
      setRegError("Please use your @uwaterloo.ca email address");
      return;
    }
    if (form.password.length < 8) {
      setRegError("Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setRegError("Passwords do not match");
      return;
    }

    setRegLoading(true);
    setRegError(null);

    try {
      const isProf = role === "professor";
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
          is_professor: isProf,
        }),
      });

      const signupData = await signupRes.json();
      if (!signupRes.ok) {
        setRegError(signupData.detail || "Signup failed");
        return;
      }

      const token = signupData.access_token;
      setAuth(token, signupData.user);

      // Upload WatCard for verification (students only)
      if (!isProf && file) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          const res = await fetch(base64);
          const blob = await res.blob();
          const fd = new FormData();
          fd.append("file", blob, "watcard.jpg");
          await fetch(`${API_URL}/api/auth/verify-watcard`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
        };
        reader.readAsDataURL(file);
      }

      router.push("/");
    } catch {
      setRegError("Failed to connect to server");
    } finally {
      setRegLoading(false);
    }
  };

  // --- Determine what to show ---

  const showStudentVerify = role === "student" && step === "verify";
  const showStudentRegister = role === "student" && step === "register";
  const showProfRegister = role === "professor";

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="bg-white border border-slate-200 rounded-4xl p-12 shadow-xl shadow-slate-200/50">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-purple-100 text-[#7E3AF2] rounded-2xl flex items-center justify-center mx-auto mb-5">
            {<UserPlus className="w-8 h-8" />}
          </div>
          <h2 className="text-3xl font-bold text-slate-900">
            Create Account
          </h2>
          <p className="text-slate-500 mt-2">
            I am a ...
          </p>
        </div>

        {/* Student / Professor toggle */}
        <div className="flex gap-3 mb-10">
          <button
            type="button"
            onClick={() => { setRole("student"); setStep("verify"); }}
            className={`flex-1 py-3.5 rounded-xl font-semibold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
              role === "student"
                ? "bg-[#7E3AF2] text-white border-[#7E3AF2]"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}
          >
            <ShieldCheck size={18} />
            Student
          </button>
          <button
            type="button"
            onClick={() => setRole("professor")}
            className={`flex-1 py-3.5 rounded-xl font-semibold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
              role === "professor"
                ? "bg-[#7E3AF2] text-white border-[#7E3AF2]"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}
          >
            <GraduationCap size={18} />
            Professor
          </button>
        </div>

        {/* ==================== STUDENT: WATCARD VERIFY ==================== */}
        {showStudentVerify && (
          <div className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-full bg-[#7E3AF2] text-white flex items-center justify-center text-xs font-bold">1</div>
              <p className="text-sm font-medium text-slate-700">Upload your WatCard for verification</p>
            </div>

            {!preview ? (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer group block transition-colors ${
                  dragging ? "border-[#7E3AF2] bg-purple-50" : "border-slate-200 hover:border-[#7E3AF2]"
                }`}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 group-hover:bg-purple-50 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-[#7E3AF2] transition-colors" />
                </div>
                <p className="font-semibold text-slate-700 text-lg">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-400 mt-2">Upload a clear photo of your WatCard (JPG or PNG)</p>
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                <img src={preview} alt="WatCard preview" className="w-full object-contain max-h-72" />
                <button onClick={clearFile} className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 hover:bg-white transition-colors shadow-sm">
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            )}

            {result && !verified && (
              <div className="rounded-2xl p-6 bg-red-50 border border-red-200">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <p className="font-bold text-lg text-red-800">Verification Failed</p>
                </div>
                <p className="text-sm text-red-700">{result.reason}</p>
              </div>
            )}

            {verifyError && (
              <div className="rounded-2xl p-6 bg-red-50 border border-red-200">
                <p className="text-red-700 text-sm">{verifyError}</p>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={!file || verifying}
              className="w-full bg-[#7E3AF2] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
              ) : (
                <><ShieldCheck className="w-5 h-5" /> Submit for Verification</>
              )}
            </button>
          </div>
        )}

        {/* ==================== STUDENT: REGISTER FORM ==================== */}
        {showStudentRegister && (
          <div className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                <CheckCircle size={14} />
              </div>
              <p className="text-sm font-medium text-emerald-600">WatCard verified</p>
              <button onClick={() => setStep("verify")} className="text-xs text-slate-400 hover:text-slate-600 ml-auto">
                Re-verify
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Name (read-only from WatCard) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input type="text" value={form.name} readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed" />
                <p className="text-xs text-slate-400 mt-1">Extracted from your WatCard</p>
              </div>

              {/* Student ID (read-only) */}
              {form.studentId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Student ID</label>
                  <input type="text" value={form.studentId} readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed" />
                  <p className="text-xs text-slate-400 mt-1">Extracted from your WatCard</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">UWaterloo Email</label>
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@uwaterloo.ca" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all" />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                <select value={form.gender} onChange={(e) => update("gender", e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white">
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
                <select value={form.program} onChange={(e) => update("program", e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white">
                  <option value="">Select program</option>
                  {PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Class Of */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Class Of</label>
                <select value={form.classOf} onChange={(e) => update("classOf", e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white">
                  <option value="">Select graduation year</option>
                  {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="At least 8 characters" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Re-enter your password" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all pr-12" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {regError && (
                <div className="rounded-xl p-4 bg-red-50 border border-red-200">
                  <p className="text-red-700 text-sm">{regError}</p>
                </div>
              )}

              <button type="submit" disabled={regLoading} className="w-full bg-[#7E3AF2] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {regLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account...</>
                ) : (
                  <><UserPlus className="w-5 h-5" /> Create Account</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ==================== PROFESSOR: REGISTER FORM ==================== */}
        {showProfRegister && (
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Enter your full name" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">UWaterloo Email</label>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@uwaterloo.ca" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all" />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
              <select value={form.gender} onChange={(e) => update("gender", e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
              <select value={form.department} onChange={(e) => update("department", e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white">
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="At least 8 characters" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Re-enter your password" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all pr-12" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {regError && (
              <div className="rounded-xl p-4 bg-red-50 border border-red-200">
                <p className="text-red-700 text-sm">{regError}</p>
              </div>
            )}

            <button type="submit" disabled={regLoading} className="w-full bg-[#7E3AF2] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {regLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account...</>
              ) : (
                <><UserPlus className="w-5 h-5" /> Register as Professor</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
