"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, ExternalLink, Mail, FlaskConical, GraduationCap, Plus, Loader2, X } from "lucide-react";
import { isLoggedIn } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEPARTMENTS = [
  "Chemical Engineering",
  "Civil and Environmental Engineering",
  "Electrical and Computer Engineering",
  "Management Sciences",
  "Mechanical and Mechatronics Engineering",
  "Systems Design Engineering",
];

type Professor = {
  id: string;
  name: string;
  department: string;
  faculty: string;
  research_interests: string[];
  email: string;
  profile_url: string;
  claimed: boolean;
};

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [isProf, setIsProf] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    department: "",
    research_interests: "",
    profile_url: "",
  });

  useEffect(() => {
    if (isLoggedIn()) {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user.is_professor) {
          setIsProf(true);
          setForm((f) => ({ ...f, name: user.name || "", department: user.department || "" }));
          // Check if prof already has a profile
          const token = localStorage.getItem("token");
          fetch(`${API_URL}/api/professors/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => {
              setHasProfile(res.ok);
            })
            .catch(() => setHasProfile(false));
        }
      }
    }
  }, []);

  const fetchProfessors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (department) params.set("department", department);
      params.set("page_size", "50");
      const res = await fetch(`${API_URL}/api/professors?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProfessors(data.professors || []);
      }
    } catch {
      // backend may not be running
    } finally {
      setLoading(false);
    }
  }, [search, department]);

  useEffect(() => {
    fetchProfessors();
  }, [fetchProfessors]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const token = localStorage.getItem("token");
      const interests = form.research_interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch(`${API_URL}/api/professors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          department: form.department,
          research_interests: interests,
          profile_url: form.profile_url,
        }),
      });
      if (res.ok) {
        setHasProfile(true);
        setShowCreateForm(false);
        fetchProfessors();
      } else {
        const data = await res.json();
        setCreateError(data.detail || "Failed to create profile");
      }
    } catch {
      setCreateError("Failed to connect to server");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Professors</h1>
          <p className="text-sm text-slate-500">Connect with UW Engineering professors</p>
        </div>
      </div>

      {/* Add My Profile box for professors without a profile */}
      {isProf && hasProfile === false && !showCreateForm && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#5D0096] text-white flex items-center justify-center shrink-0">
              <GraduationCap size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">Add your professor profile</h3>
              <p className="text-sm text-slate-600 mb-4">
                Make yourself visible to students looking for research opportunities, collaborators, and mentorship.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-[#5D0096] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#865DA4] transition-all flex items-center gap-2"
              >
                <Plus size={16} />
                Add My Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create profile form */}
      {showCreateForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900 text-lg">Create Your Profile</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#5D0096] focus:ring-2 focus:ring-purple-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#5D0096] outline-none"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Research Interests</label>
              <input
                type="text"
                value={form.research_interests}
                onChange={(e) => setForm({ ...form, research_interests: e.target.value })}
                placeholder="Machine Learning, Computer Vision, NLP (comma-separated)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#5D0096] focus:ring-2 focus:ring-purple-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Profile / Lab URL</label>
              <input
                type="url"
                value={form.profile_url}
                onChange={(e) => setForm({ ...form, profile_url: e.target.value })}
                placeholder="https://uwaterloo.ca/..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#5D0096] focus:ring-2 focus:ring-purple-100 outline-none"
              />
            </div>

            {createError && (
              <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                <p className="text-red-700 text-sm">{createError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="bg-[#5D0096] text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-[#865DA4] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Create Profile
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2.5 rounded-xl font-medium text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search + Department filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or research interest..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#5D0096] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
          />
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#5D0096] outline-none"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Professors grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : professors.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No professors found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {professors.map((prof) => (
            <div
              key={prof.id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-[#5D0096] flex items-center justify-center text-sm font-bold shrink-0">
                    {prof.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{prof.name}</h3>
                    <p className="text-xs text-slate-400">{prof.department}</p>
                  </div>
                </div>
                {prof.claimed && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                    On Platform
                  </span>
                )}
              </div>

              {prof.research_interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {prof.research_interests.slice(0, 4).map((interest) => (
                    <span key={interest} className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                      {interest}
                    </span>
                  ))}
                  {prof.research_interests.length > 4 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      +{prof.research_interests.length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <a
                  href={`mailto:${prof.email}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#5D0096] transition-colors"
                >
                  <Mail size={14} />
                  Email
                </a>
                {prof.profile_url && (
                  <a
                    href={prof.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#5D0096] transition-colors"
                  >
                    <ExternalLink size={14} />
                    Profile
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
