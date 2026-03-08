"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, X, Plus, ExternalLink } from "lucide-react";
import { isLoggedIn } from "@/lib/auth";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEPARTMENTS = [
  "Chemical Engineering",
  "Civil and Environmental Engineering",
  "Electrical and Computer Engineering",
  "Management Sciences",
  "Mechanical and Mechatronics Engineering",
  "Systems Design Engineering",
];

const DOMAINS = [
  "ai_ml", "healthcare", "sustainability", "robotics", "embedded",
  "fintech", "web", "data", "security", "other",
];

const DOMAIN_LABELS: Record<string, string> = {
  ai_ml: "AI / ML", healthcare: "Healthcare", sustainability: "Sustainability",
  robotics: "Robotics", embedded: "Embedded", fintech: "Fintech",
  web: "Web", data: "Data", security: "Security", other: "Other",
};

const SKILL_SUGGESTIONS = [
  "Python", "C++", "C", "MATLAB", "Java", "JavaScript", "TypeScript",
  "React", "TensorFlow", "PyTorch", "ROS", "Arduino", "FPGA", "Verilog",
  "CAD", "SolidWorks", "PCB Design", "Signal Processing", "Statistics",
  "Linear Algebra", "Machine Learning", "Deep Learning", "NLP",
  "Computer Vision", "Embedded Systems", "Control Systems",
  "Data Analysis", "R", "SQL", "Docker", "Linux", "Git",
];

const COMPENSATION_TYPES = [
  { value: "volunteer", label: "Volunteer" },
  { value: "credit", label: "Course Credit" },
  { value: "ura", label: "URA (Paid)" },
  { value: "usra", label: "USRA (Paid)" },
  { value: "nserc", label: "NSERC (Paid)" },
  { value: "other_paid", label: "Other Paid" },
];

const TERMS = ["Winter", "Spring", "Fall"];
const YEARS = ["2025", "2026", "2027"];

const OPEN_TO_OPTIONS = [
  { value: "1A", label: "1A" },
  { value: "1B", label: "1B" },
  { value: "2A", label: "2A" },
  { value: "2B", label: "2B" },
  { value: "3A", label: "3A" },
  { value: "3B", label: "3B" },
  { value: "4A", label: "4A" },
  { value: "4B", label: "4B" },
  { value: "graduate", label: "Graduate" },
];

const PROGRAMS = [
  "Any Program",
  "Biomedical Engineering",
  "Chemical Engineering",
  "Civil Engineering",
  "Computer Engineering",
  "Electrical Engineering",
  "Environmental Engineering",
  "Geological Engineering",
  "Management Engineering",
  "Mechanical Engineering",
  "Mechatronics Engineering",
  "Nanotechnology Engineering",
  "Software Engineering",
  "Systems Design Engineering",
  "Architectural Engineering",
];

const APPLICATION_METHODS = [
  { value: "platform", label: "Apply on platform" },
  { value: "email", label: "Apply via email" },
  { value: "external", label: "External link (WaterlooWorks, etc.)" },
];

const STATUS_OPTIONS = [
  { value: "recruiting", label: "Actively Recruiting", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "waitlist", label: "Waitlist", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "closed", label: "Closed", color: "bg-red-100 text-red-700 border-red-200" },
];

export default function NewResearchProjectPage() {
  const router = useRouter();
  const [isProf, setIsProf] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [labName, setLabName] = useState("");
  const [courseAffiliation, setCourseAffiliation] = useState("");
  const [summary, setSummary] = useState("");
  const [tasks, setTasks] = useState("");
  const [domains, setDomains] = useState<string[]>([]);

  // Skills
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [niceSkillInput, setNiceSkillInput] = useState("");
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [showNiceSuggestions, setShowNiceSuggestions] = useState(false);

  // Time commitment
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [startTerm, setStartTerm] = useState("");
  const [startYear, setStartYear] = useState("");
  const [duration, setDuration] = useState("");

  // Compensation
  const [compensationType, setCompensationType] = useState<string[]>([]);

  // Open to
  const [openToYears, setOpenToYears] = useState<string[]>([]);
  const [openToPrograms, setOpenToPrograms] = useState<string[]>(["Any Program"]);

  // Application
  const [applicationMethod, setApplicationMethod] = useState("platform");
  const [externalLink, setExternalLink] = useState("");

  // Status
  const [status, setStatus] = useState("recruiting");

  // Submit
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const li = isLoggedIn();
    setLoggedIn(li);
    if (li) {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        setIsProf(user.is_professor);
      }
    }
  }, []);

  const addSkill = (skill: string, type: "required" | "nice") => {
    const s = skill.trim();
    if (!s) return;
    if (type === "required" && !requiredSkills.includes(s)) {
      setRequiredSkills([...requiredSkills, s]);
    } else if (type === "nice" && !niceToHaveSkills.includes(s)) {
      setNiceToHaveSkills([...niceToHaveSkills, s]);
    }
    if (type === "required") { setSkillInput(""); setShowSkillSuggestions(false); }
    else { setNiceSkillInput(""); setShowNiceSuggestions(false); }
  };

  const toggleDomain = (d: string) => {
    setDomains((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const toggleCompensation = (c: string) => {
    setCompensationType((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const toggleOpenToYear = (y: string) => {
    setOpenToYears((prev) => prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]);
  };

  const toggleProgram = (p: string) => {
    if (p === "Any Program") {
      setOpenToPrograms(["Any Program"]);
      return;
    }
    setOpenToPrograms((prev) => {
      const without = prev.filter((x) => x !== "Any Program" && x !== p);
      if (prev.includes(p)) return without.length === 0 ? ["Any Program"] : without;
      return [...without, p];
    });
  };

  const filteredSkills = (input: string, exclude: string[]) =>
    SKILL_SUGGESTIONS.filter(
      (s) => s.toLowerCase().includes(input.toLowerCase()) && !exclude.includes(s)
    ).slice(0, 6);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !tasks) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to post");
        return;
      }

      // Build metadata section
      const metaParts: string[] = [];
      metaParts.push("Type: Research Project");
      if (labName) metaParts.push(`Lab: ${labName}`);
      if (courseAffiliation) metaParts.push(`Course: ${courseAffiliation}`);
      if (requiredSkills.length) metaParts.push(`Required Skills: ${requiredSkills.join(", ")}`);
      if (niceToHaveSkills.length) metaParts.push(`Nice to Have: ${niceToHaveSkills.join(", ")}`);
      if (hoursPerWeek) metaParts.push(`Hours/Week: ${hoursPerWeek}`);
      if (startTerm && startYear) metaParts.push(`Start: ${startTerm} ${startYear}`);
      if (duration) metaParts.push(`Duration: ${duration}`);
      if (compensationType.length) {
        const labels = compensationType.map((c) => COMPENSATION_TYPES.find((x) => x.value === c)?.label || c);
        metaParts.push(`Compensation: ${labels.join(", ")}`);
      }
      if (openToYears.length) metaParts.push(`Open to: ${openToYears.join(", ")}`);
      if (openToPrograms.length && !openToPrograms.includes("Any Program")) {
        metaParts.push(`Programs: ${openToPrograms.join(", ")}`);
      }
      metaParts.push(`Application: ${APPLICATION_METHODS.find((m) => m.value === applicationMethod)?.label}`);
      if (externalLink) metaParts.push(`Apply Link: ${externalLink}`);
      metaParts.push(`Status: ${STATUS_OPTIONS.find((s) => s.value === status)?.label}`);
      metaParts.push("Looking for: collaborators");

      // Combine summary + tasks as the body
      const bodyText = `${summary}\n\n**What you'll do:**\n${tasks}`;
      const fullBody = `${bodyText}\n\n---\n${metaParts.join("\n")}`;

      const techStack = [...requiredSkills.slice(0, 5)];

      const formData = new FormData();
      formData.append("title", title);
      formData.append("body", fullBody.slice(0, 2000));
      formData.append("project_stage", "idea");
      formData.append("category", "both");
      formData.append("tech_stack", JSON.stringify(techStack));
      formData.append("field", JSON.stringify(domains));

      const res = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Failed to create research project");
        return;
      }

      router.push("/research");
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (!loggedIn) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-medium">Sign in to create a research project</p>
        <Link href="/login" className="text-sm text-[#7E3AF2] font-medium hover:underline mt-2 inline-block">Sign In</Link>
      </div>
    );
  }

  if (!isProf) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-medium">This form is for professors only</p>
        <p className="text-sm text-slate-400 mt-1">Students can post projects from the <Link href="/post/new" className="text-[#7E3AF2] hover:underline">regular post form</Link></p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Create Research Project</h1>
      <p className="text-sm text-slate-500 mb-8">Post a research opportunity for UW Engineering students</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Project Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Deep RL for Robotic Manipulation in Unstructured Environments"
            maxLength={100}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{title.length}/100</p>
        </div>

        {/* Lab / Course Affiliation */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Lab Name</label>
            <input
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              placeholder="e.g. Adaptive Systems Lab"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Affiliation</label>
            <input
              type="text"
              value={courseAffiliation}
              onChange={(e) => setCourseAffiliation(e.target.value)}
              placeholder="e.g. ECE 457B, FYDP"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
          </div>
        </div>

        {/* Project Summary */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Project Summary <span className="text-red-400">*</span>
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief overview of the research problem, goals, and significance..."
            rows={4}
            maxLength={800}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{summary.length}/800</p>
        </div>

        {/* Tasks */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            What will the student do? <span className="text-red-400">*</span>
          </label>
          <textarea
            value={tasks}
            onChange={(e) => setTasks(e.target.value)}
            placeholder="Specific tasks and responsibilities, e.g.:&#10;- Implement simulation environment in PyBullet&#10;- Train and evaluate RL policies&#10;- Run experiments on physical robot arm&#10;- Contribute to paper writing"
            rows={5}
            maxLength={600}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{tasks.length}/600</p>
        </div>

        {/* Domains */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Research Domains</label>
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

        {/* Required Skills */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Expected Skills</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {requiredSkills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-purple-50 text-purple-700">
                {s}
                <button type="button" onClick={() => setRequiredSkills(requiredSkills.filter((x) => x !== s))}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => { setSkillInput(e.target.value); setShowSkillSuggestions(true); }}
              onFocus={() => setShowSkillSuggestions(true)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput, "required"); } }}
              placeholder="Type to search or add..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
            {showSkillSuggestions && skillInput && filteredSkills(skillInput, requiredSkills).length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {filteredSkills(skillInput, requiredSkills).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkill(s, "required")}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-[#7E3AF2] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nice to Have Skills */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nice to Have <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
          <div className="flex flex-wrap gap-2 mb-2">
            {niceToHaveSkills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                {s}
                <button type="button" onClick={() => setNiceToHaveSkills(niceToHaveSkills.filter((x) => x !== s))}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              value={niceSkillInput}
              onChange={(e) => { setNiceSkillInput(e.target.value); setShowNiceSuggestions(true); }}
              onFocus={() => setShowNiceSuggestions(true)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(niceSkillInput, "nice"); } }}
              placeholder="Type to search or add..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
            {showNiceSuggestions && niceSkillInput && filteredSkills(niceSkillInput, [...requiredSkills, ...niceToHaveSkills]).length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {filteredSkills(niceSkillInput, [...requiredSkills, ...niceToHaveSkills]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkill(s, "nice")}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-[#7E3AF2] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Time Commitment */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Time Commitment</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Hours / week</label>
              <input
                type="text"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                placeholder="e.g. 10-15"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#7E3AF2] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Term</label>
              <div className="flex gap-1.5">
                <select
                  value={startTerm}
                  onChange={(e) => setStartTerm(e.target.value)}
                  className="flex-1 px-2 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#7E3AF2] outline-none"
                >
                  <option value="">Term</option>
                  {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="flex-1 px-2 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#7E3AF2] outline-none"
                >
                  <option value="">Year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#7E3AF2] outline-none"
              >
                <option value="">Select</option>
                <option value="1 term">1 Term (4 months)</option>
                <option value="2 terms">2 Terms (8 months)</option>
                <option value="3 terms">3 Terms (12 months)</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Compensation Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Compensation Type <span className="text-xs text-slate-400 font-normal">(select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {COMPENSATION_TYPES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleCompensation(c.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  compensationType.includes(c.value)
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Open To */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Open To (Year/Term)</label>
            <div className="flex flex-wrap gap-2">
              {OPEN_TO_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggleOpenToYear(o.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    openToYears.includes(o.value)
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Open To (Programs)</label>
            <div className="flex flex-wrap gap-2">
              {PROGRAMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleProgram(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    openToPrograms.includes(p)
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Application Method */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Application Method</label>
          <div className="space-y-3">
            <div className="flex gap-2">
              {APPLICATION_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setApplicationMethod(m.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    applicationMethod === m.value
                      ? "bg-[#7E3AF2] text-white border-[#7E3AF2]"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {applicationMethod === "external" && (
              <div className="flex items-center gap-2">
                <ExternalLink size={16} className="text-slate-400" />
                <input
                  type="url"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="https://waterlooworks.uwaterloo.ca/..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
              </div>
            )}
          </div>
        </div>

        {/* Status Toggle */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Recruiting Status</label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  status === s.value
                    ? s.color
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {status === "recruiting" && (
            <p className="text-xs text-slate-400 mt-1.5">You&apos;ll get a reminder each term to confirm this project is still active</p>
          )}
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
              Publishing...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Publish Research Project
            </>
          )}
        </button>
      </form>
    </div>
  );
}
