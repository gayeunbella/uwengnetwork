"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, ExternalLink, Mail, Plus } from "lucide-react";
import { isLoggedIn } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

const DEPARTMENTS = [
  "Chemical Engineering",
  "Civil and Environmental Engineering",
  "Electrical and Computer Engineering",
  "Management Sciences",
  "Mechanical and Mechatronics Engineering",
  "Systems Design Engineering",
];

export default function ResearchPage() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [isProf, setIsProf] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        setIsProf(user.is_professor);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Research & Professors</h1>
          <p className="text-sm text-slate-500">Find professors by research interest and connect</p>
        </div>
        {isProf && (
          <Link
            href="/research/new"
            className="bg-[#7E3AF2] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#6D28D9] transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            Post Research Project
          </Link>
        )}
      </div>

      {/* Search + Department filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or research interest..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
          />
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#7E3AF2] outline-none"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Professor grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading professors...</div>
      ) : professors.length === 0 ? (
        <div className="text-center py-16">
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
                <div>
                  <h3 className="font-semibold text-slate-900">{prof.name}</h3>
                  <p className="text-xs text-slate-400">{prof.department}</p>
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

              <div className="flex gap-2">
                <a
                  href={`mailto:${prof.email}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#7E3AF2] transition-colors"
                >
                  <Mail size={14} />
                  Email
                </a>
                {prof.profile_url && (
                  <a
                    href={prof.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#7E3AF2] transition-colors"
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
