"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Upload, X, Loader2, CheckCircle, XCircle } from "lucide-react";

type AnalysisResult = {
  isWatCard: boolean;
  isEngineering: boolean;
  faculty: string | null;
  name: string | null;
  studentId: string | null;
  confidence: string;
  reason: string;
};

export default function VerifyPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
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

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/verify", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Analysis failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const verified = result?.isWatCard && result?.isEngineering;

  const handleContinue = async () => {
    if (!result || !file) return;
    // Store the WatCard image as base64 in sessionStorage for the register page
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem("watcardImage", reader.result as string);
      const params = new URLSearchParams();
      if (result.name) params.set("name", result.name);
      if (result.studentId) params.set("studentId", result.studentId);
      if (result.faculty) params.set("faculty", result.faculty);
      router.push(`/register?${params.toString()}`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-purple-100 text-[#7E3AF2] rounded-2xl flex items-center justify-center font-bold text-xl">
            1
          </div>
          <div>
            <h2 className="text-2xl font-bold">WatCard Verification</h2>
            <p className="text-slate-500">Scan your physical ID for Engineering status</p>
          </div>
        </div>

        <div className="space-y-8">
          {!preview ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer group block transition-colors ${
                dragging
                  ? "border-[#7E3AF2] bg-purple-50"
                  : "border-slate-200 hover:border-[#7E3AF2]"
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-50">
                <Upload className="text-slate-400 group-hover:text-[#7E3AF2]" />
              </div>
              <p className="font-medium text-slate-700">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-400 mt-1">WATCARD (JPG or PNG only)</p>
            </label>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200">
              <img src={preview} alt="WatCard preview" className="w-full object-contain max-h-64" />
              <button
                onClick={clearFile}
                className="absolute top-3 right-3 bg-white/80 backdrop-blur rounded-full p-1.5 hover:bg-white transition-colors"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          )}

          {result && (
            <div
              className={`rounded-2xl p-6 ${
                verified
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {verified ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <p className={`font-bold text-lg ${verified ? "text-green-800" : "text-red-800"}`}>
                  {verified ? "Verified Engineering Student" : "Verification Failed"}
                </p>
              </div>
              <p className={`text-sm ${verified ? "text-green-700" : "text-red-700"}`}>
                {result.reason}
              </p>
              {result.name && (
                <p className="text-sm text-slate-500 mt-1">Name: {result.name}</p>
              )}
              {result.studentId && (
                <p className="text-sm text-slate-500 mt-1">Student ID: {result.studentId}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">Confidence: {result.confidence}</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl p-6 bg-red-50 border border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {verified ? (
            <button
              onClick={handleContinue}
              className="w-full bg-[#7E3AF2] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
            >
              Continue to Registration
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="w-full bg-[#7E3AF2] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Submit for AI Analysis
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
