"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, Loader2, X, Github, Video, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { isLoggedIn } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PROJECT_TYPES = [
  { value: "personal", label: "Personal Project" },
  { value: "course", label: "Course Project" },
  { value: "research", label: "Research Project" },
];

const STAGES = [
  { value: "idea", label: "Idea" },
  { value: "early_prototype", label: "Prototype" },
  { value: "working_prototype", label: "MVP" },
  { value: "polished", label: "Production" },
  { value: "shipped", label: "Shipped" },
];

const DOMAINS = [
  "ai_ml", "healthcare", "sustainability", "robotics", "embedded",
  "fintech", "web", "mobile", "data", "security", "other",
];

const DOMAIN_LABELS: Record<string, string> = {
  ai_ml: "AI / ML", healthcare: "Healthcare", sustainability: "Sustainability",
  robotics: "Robotics", embedded: "Embedded", fintech: "Fintech",
  web: "Web", mobile: "Mobile", data: "Data", security: "Security", other: "Other",
};

const LOOKING_FOR = [
  { value: "feedback", label: "Just feedback" },
  { value: "collaborators", label: "Collaborators" },
  { value: "supervision", label: "Research supervision" },
  { value: "job", label: "Internship / Job" },
];

const TECH_SUGGESTIONS = [
  "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js",
  "C++", "C", "Java", "Rust", "Go", "Swift", "Kotlin",
  "Arduino", "Raspberry Pi", "TensorFlow", "PyTorch", "OpenCV",
  "AWS", "Docker", "PostgreSQL", "MongoDB", "Firebase",
  "Flutter", "React Native", "Figma", "MATLAB", "ROS",
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const YEARS = ["2024", "2025", "2026", "2027"];

function parseBody(body: string) {
  const parts = body.split("\n\n---\n");
  const description = parts[0];
  const meta: Record<string, string> = {};
  if (parts[1]) {
    parts[1].split("\n").forEach((line) => {
      const idx = line.indexOf(": ");
      if (idx > -1) meta[line.slice(0, idx)] = line.slice(idx + 2);
    });
  }
  return { description, meta };
}

export default function EditPostPage() {
  const { id } = useParams();
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [projectType, setProjectType] = useState("");
  const [stage, setStage] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [showTechSuggestions, setShowTechSuggestions] = useState(false);
  const [domains, setDomains] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("community");
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [endPresent, setEndPresent] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [existingMedia, setExistingMedia] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Preserve research-specific meta that we don't edit here
  const [preservedMeta, setPreservedMeta] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    if (!isLoggedIn()) { router.push("/login"); return; }

    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/posts/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Post not found");
        return res.json();
      })
      .then((post) => {
        const { description, meta } = parseBody(post.body);
        setTitle(post.title);
        setBody(description);
        setStage(post.project_stage);
        setTechStack(post.tech_stack || []);
        setDomains(post.field || []);
        setExistingMedia(post.media || []);

        // Parse project type from meta
        const typeLabel = meta["Type"] || "";
        const typeValue = PROJECT_TYPES.find((t) => t.label === typeLabel)?.value || "";
        setProjectType(typeValue);

        // Parse looking for from meta
        const lfLabels = (meta["Looking for"] || "").split(", ").filter(Boolean);
        const lfValues = lfLabels.map((label) => LOOKING_FOR.find((l) => l.label === label)?.value || "").filter(Boolean);
        setLookingFor(lfValues);

        // Parse timeline
        const timeline = meta["Timeline"] || "";
        if (timeline) {
          const timelineParts = timeline.split(" – ");
          const startParts = (timelineParts[0] || "").split(" ");
          setStartMonth(startParts[0] || "");
          setStartYear(startParts[1] || "");
          if (timelineParts[1] === "Present") {
            setEndPresent(true);
          } else if (timelineParts[1]) {
            const endParts = timelineParts[1].split(" ");
            setEndMonth(endParts[0] || "");
            setEndYear(endParts[1] || "");
          }
        }

        setGithubUrl(meta["GitHub"] || "");
        setDemoUrl(meta["Demo"] || "");
        setVisibility(meta["Visibility"] === "Public" ? "public" : "community");

        // Preserve research-specific meta
        const preserveKeys = ["Lab", "Course", "Required Skills", "Nice to Have", "Hours/Week", "Start", "Duration", "Compensation", "Open to", "Programs", "Application", "Apply Link", "Status"];
        const preserved: Record<string, string> = {};
        preserveKeys.forEach((k) => { if (meta[k]) preserved[k] = meta[k]; });
        setPreservedMeta(preserved);
      })
      .catch(() => setError("Failed to load post"))
      .finally(() => setPageLoading(false));
  }, [id, router]);

  const addTech = (tech: string) => {
    const t = tech.trim();
    if (t && !techStack.includes(t) && techStack.length < 5) {
      setTechStack([...techStack, t]);
    }
    setTechInput("");
    setShowTechSuggestions(false);
  };

  const removeTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
  };

  const toggleDomain = (d: string) => {
    setDomains((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const toggleLookingFor = (l: string) => {
    setLookingFor((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);
  };

  const filteredSuggestions = TECH_SUGGESTIONS.filter(
    (t) => t.toLowerCase().includes(techInput.toLowerCase()) && !techStack.includes(t)
  ).slice(0, 6);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body || !stage) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) { setError("You must be logged in"); return; }

      const timeWindow = startMonth && startYear
        ? `${startMonth} ${startYear}` + (endPresent ? " – Present" : endMonth && endYear ? ` – ${endMonth} ${endYear}` : "")
        : "";

      const metaParts: string[] = [];
      if (projectType) metaParts.push(`Type: ${PROJECT_TYPES.find((t) => t.value === projectType)?.label}`);
      if (timeWindow) metaParts.push(`Timeline: ${timeWindow}`);
      if (lookingFor.length) metaParts.push(`Looking for: ${lookingFor.map((l) => LOOKING_FOR.find((x) => x.value === l)?.label).join(", ")}`);
      if (githubUrl) metaParts.push(`GitHub: ${githubUrl}`);
      if (demoUrl) metaParts.push(`Demo: ${demoUrl}`);
      if (visibility === "public") metaParts.push("Visibility: Public");
      // Re-add preserved research meta
      Object.entries(preservedMeta).forEach(([k, v]) => metaParts.push(`${k}: ${v}`));

      const fullBody = metaParts.length > 0
        ? `${body}\n\n---\n${metaParts.join("\n")}`
        : body;

      const formData = new FormData();
      formData.append("title", title);
      formData.append("body", fullBody.slice(0, 2000));
      formData.append("project_stage", stage);
      formData.append("tech_stack", JSON.stringify(techStack));
      formData.append("field", JSON.stringify(domains));

      const res = await fetch(`${API_URL}/api/posts/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Failed to update post");
        return;
      }

      router.push(`/post/${id}`);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 text-slate-300 mx-auto animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Edit Post</h1>
          <p className="text-sm text-slate-500 mb-6">Update your project details</p>

          {/* Title */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Motor Controller v2 – now with PID tuning"
              maxLength={100}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#5D0096] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What are you building? What problem does it solve? What's the current status?"
              rows={5}
              maxLength={1500}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#5D0096] focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{body.length}/1500</p>
          </div>
        </div>

        {/* Project Type & Stage */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Project Type <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setProjectType(t.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    projectType === t.value
                      ? "bg-[#5D0096] text-white border-[#5D0096]"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Stage <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {STAGES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStage(s.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    stage === s.value
                      ? "bg-[#5D0096] text-white border-[#5D0096]"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tech Stack & Domains */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Tech Stack (max 5)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {techStack.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-purple-50 text-purple-700">
                  {t}
                  <button type="button" onClick={() => removeTech(t)}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            {techStack.length < 5 && (
              <div className="relative">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => { setTechInput(e.target.value); setShowTechSuggestions(true); }}
                  onFocus={() => setShowTechSuggestions(true)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(techInput); } }}
                  placeholder="Type to search or add..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#5D0096] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
                {showTechSuggestions && techInput && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    {filteredSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addTech(s)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-[#5D0096] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Domains</label>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDomain(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    domains.includes(d)
                      ? "bg-purple-100 text-purple-700 border-purple-200"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {DOMAIN_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Time Window */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <label className="block text-sm font-semibold text-slate-900 mb-3">Time Window</label>
          <div className="flex items-center gap-3">
            <div className="flex gap-2 flex-1">
              <select value={startMonth} onChange={(e) => setStartMonth(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#5D0096] outline-none">
                <option value="">Month</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={startYear} onChange={(e) => setStartYear(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#5D0096] outline-none">
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <span className="text-slate-400 text-sm">to</span>
            {stage !== "shipped" && !endPresent ? (
              <div className="flex gap-2 flex-1 items-center">
                <select value={endMonth} onChange={(e) => setEndMonth(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#5D0096] outline-none">
                  <option value="">Month</option>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={endYear} onChange={(e) => setEndYear(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#5D0096] outline-none">
                  <option value="">Year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => { setEndPresent(true); setEndMonth(""); setEndYear(""); }}
                  className="text-xs text-[#5D0096] font-medium whitespace-nowrap hover:underline"
                >
                  Present
                </button>
              </div>
            ) : stage !== "shipped" ? (
              <div className="flex-1 flex items-center gap-2">
                <span className="px-4 py-2.5 rounded-xl border border-[#5D0096] bg-purple-50 text-[#5D0096] text-sm font-medium flex-1 text-center">
                  Present
                </span>
                <button
                  type="button"
                  onClick={() => setEndPresent(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 whitespace-nowrap"
                >
                  Set date
                </button>
              </div>
            ) : (
              <div className="flex gap-2 flex-1">
                <select value={endMonth} onChange={(e) => setEndMonth(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#5D0096] outline-none">
                  <option value="">Month</option>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={endYear} onChange={(e) => setEndYear(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#5D0096] outline-none">
                  <option value="">Year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <label className="block text-sm font-semibold text-slate-900 mb-3">Attachments</label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Github size={16} className="text-slate-400" />
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="GitHub repository URL"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#5D0096] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Video size={16} className="text-slate-400" />
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="Demo video URL (YouTube, Loom, etc.)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#5D0096] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
              />
            </div>

            {/* Existing screenshots */}
            {existingMedia.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-2">Current screenshots</p>
                <div className="flex gap-3">
                  {existingMedia.map((url, i) => (
                    <div key={i} className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                      <img src={`${API_URL}${url}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Looking For & Visibility */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Looking For</label>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => toggleLookingFor(l.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    lookingFor.includes(l.value)
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Visibility</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVisibility("community")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  visibility === "community"
                    ? "bg-[#5D0096] text-white border-[#5D0096]"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                Waterloo Only
              </button>
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  visibility === "public"
                    ? "bg-[#5D0096] text-white border-[#5D0096]"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                Public
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {visibility === "public" ? "Visible to everyone including recruiters" : "Only visible to verified UW members"}
            </p>
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
          className="w-full bg-[#5D0096] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#865DA4] transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </form>
    </div>
  );
}
