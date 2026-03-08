"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Clock, FlaskConical, Users, ThumbsUp, MessageSquare, Share2, Mail, Check, X } from "lucide-react";
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

const DOMAIN_LABELS: Record<string, string> = {
  ai_ml: "AI / ML", healthcare: "Healthcare", sustainability: "Sustainability",
  robotics: "Robotics", embedded: "Embedded", fintech: "Fintech",
  web: "Web", mobile: "Mobile", data: "Data", security: "Security", other: "Other",
};

const DOMAIN_COLORS: Record<string, string> = {
  ai_ml: "bg-violet-100 text-violet-700",
  healthcare: "bg-rose-100 text-rose-700",
  sustainability: "bg-green-100 text-green-700",
  robotics: "bg-orange-100 text-orange-700",
  embedded: "bg-yellow-100 text-yellow-700",
  fintech: "bg-cyan-100 text-cyan-700",
  web: "bg-sky-100 text-sky-700",
  mobile: "bg-indigo-100 text-indigo-700",
  data: "bg-teal-100 text-teal-700",
  security: "bg-red-100 text-red-700",
  other: "bg-slate-100 text-slate-600",
};

const POPULAR_SKILLS = [
  "Python", "MATLAB", "C++", "R", "TensorFlow", "PyTorch",
  "ROS", "CAD", "LabVIEW", "Simulink", "Verilog", "FPGA",
];

type ResearchPost = {
  id: string;
  title: string;
  body: string;
  project_stage: string;
  category: string;
  tech_stack: string[];
  field: string[];
  media: string[];
  created_at: string;
  author: {
    id: string;
    name: string;
    department: string;
    year: string;
    profile_picture: string;
  };
};

type Comment = {
  id: string;
  user: { id: string; name: string; department: string; year: string; profile_picture: string };
  body: string;
  created_at: string;
};

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

function timeAgo(dateStr: string) {
  const date = new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
  const diff = Date.now() - date.getTime();
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days <= 10) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ResearchFilterSidebar({
  domainFilter, setDomainFilter,
  skillFilter, setSkillFilter,
  paidOnly, setPaidOnly,
  departmentFilter, setDepartmentFilter,
}: {
  domainFilter: string;
  setDomainFilter: (v: string) => void;
  skillFilter: string[];
  setSkillFilter: (v: string[]) => void;
  paidOnly: boolean;
  setPaidOnly: (v: boolean) => void;
  departmentFilter: string;
  setDepartmentFilter: (v: string) => void;
}) {
  const activeCount = [domainFilter, paidOnly, skillFilter.length > 0, departmentFilter].filter(Boolean).length;

  return (
    <div className="w-60 shrink-0 space-y-5">
      {activeCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">{activeCount} filter{activeCount > 1 ? "s" : ""} active</span>
          <button
            onClick={() => {
              setDomainFilter("");
              setSkillFilter([]);
              setPaidOnly(false);
              setDepartmentFilter("");
            }}
            className="text-xs text-[#5D0096] font-medium hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Department</p>
        <div className="space-y-1">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(departmentFilter === dept ? "" : dept)}
              className={`w-full text-left text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                departmentFilter === dept
                  ? "bg-purple-50 text-[#5D0096]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Domain</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setDomainFilter(domainFilter === key ? "" : key)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                domainFilter === key
                  ? DOMAIN_COLORS[key]
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Skills</p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SKILLS.map((skill) => {
            const active = skillFilter.includes(skill);
            return (
              <button
                key={skill}
                onClick={() =>
                  setSkillFilter(
                    active ? skillFilter.filter((s) => s !== skill) : [...skillFilter, skill]
                  )
                }
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  active
                    ? "bg-[#5D0096] text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={paidOnly}
            onChange={(e) => setPaidOnly(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#5D0096] focus:ring-purple-200 accent-[#5D0096]"
          />
          <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">
            Paid positions only
          </span>
        </label>
      </div>
    </div>
  );
}

function ResearchPostCard({ post, onLoginPrompt, initialLiked }: { post: ResearchPost; onLoginPrompt: (msg: string) => void; initialLiked?: boolean }) {
  const [liked, setLiked] = useState(initialLiked || false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const requireAuth = (action: string): boolean => {
    if (!localStorage.getItem("token")) {
      onLoginPrompt(action);
      return false;
    }
    return true;
  };

  const handleLike = async () => {
    if (!requireAuth("like this post")) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
      }
    } catch { /* ignore */ }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch { /* ignore */ }
    setLoadingComments(false);
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(!showComments);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    if (!requireAuth("comment on this post")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ body: commentText.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setCommentText("");
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { description, meta } = parseBody(post.body);
  const lookingFor = meta["Looking for"];
  const status = meta["Status"];
  const lab = meta["Lab"];
  const compensation = meta["Compensation"];
  const hoursPerWeek = meta["Hours/Week"];
  const openTo = meta["Open to"];
  const skills = meta["Required Skills"];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all">
      {/* Author header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-[#5D0096] flex items-center justify-center text-lg font-bold shrink-0">
            {post.author.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{post.author.name}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>{post.author.department}</span>
              {lab && (
                <>
                  <span>&middot;</span>
                  <span className="flex items-center gap-1"><FlaskConical size={11} />{lab}</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock size={11} />
              {timeAgo(post.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0 justify-end">
            {status && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                status === "Actively Recruiting" ? "bg-green-100 text-green-700" :
                status === "Waitlist" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                {status}
              </span>
            )}
            {lookingFor && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                {lookingFor}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Post content */}
      <Link href={`/post/${post.id}`} className="block">
        <div className="px-5 pb-3">
          <h3 className="font-semibold text-slate-900 text-[15px] mb-1.5">{post.title}</h3>
          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{description}</p>
        </div>

        {/* Research details pills */}
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {post.field.map((f) => (
            <span key={f} className={`text-xs px-2 py-0.5 rounded-full font-medium ${DOMAIN_COLORS[f] || "bg-slate-100 text-slate-600"}`}>
              {DOMAIN_LABELS[f] || f}
            </span>
          ))}
          {compensation && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              {compensation}
            </span>
          )}
          {hoursPerWeek && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
              {hoursPerWeek} hrs/wk
            </span>
          )}
          {openTo && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-medium flex items-center gap-1">
              <Users size={11} />
              {openTo}
            </span>
          )}
        </div>

        {/* Skills */}
        {skills && (
          <div className="px-5 pb-3 flex flex-wrap gap-1.5">
            {skills.split(", ").slice(0, 5).map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Media */}
        {post.media.length > 0 && (
          <div className="border-t border-slate-100">
            {post.media.length === 1 ? (
              <img src={`${API_URL}${post.media[0]}`} alt="" className="w-full max-h-96 object-cover" />
            ) : (
              <div className="grid grid-cols-2 gap-0.5">
                {post.media.slice(0, 4).map((url, i) => (
                  <div key={i} className="aspect-video bg-slate-100 overflow-hidden">
                    <img src={`${API_URL}${url}`} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Link>

      {/* Action bar */}
      <div className="border-t border-slate-100 px-2 py-1 flex">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            liked
              ? "text-[#5D0096]"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          <ThumbsUp size={18} fill={liked ? "currentColor" : "none"} />
          {liked ? "Liked" : "Like"}
        </button>
        <button
          onClick={toggleComments}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            showComments
              ? "text-[#5D0096]"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          <MessageSquare size={18} />
          Comment
        </button>
        <button
          onClick={handleShare}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            copied
              ? "text-emerald-600"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          {copied ? <Check size={18} /> : <Share2 size={18} />}
          {copied ? "Copied!" : "Copy Link"}
        </button>
        <button
          onClick={() => {
            if (requireAuth("send a message")) window.location.href = `/messages/${post.author.id}`;
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <Mail size={18} />
          Message
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-[#5D0096] flex items-center justify-center text-xs font-bold shrink-0">
              You
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 rounded-full border border-slate-200 text-sm focus:border-[#5D0096] focus:ring-1 focus:ring-purple-100 outline-none transition-all"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || submitting}
                className="px-4 py-2 rounded-full bg-[#5D0096] text-white text-sm font-medium hover:bg-[#865DA4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>

          {loadingComments ? (
            <p className="text-xs text-slate-400 text-center py-2">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-[#5D0096] flex items-center justify-center text-xs font-bold shrink-0">
                    {c.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-slate-50 rounded-xl px-4 py-2.5">
                      <p className="text-sm font-semibold text-slate-900">{c.user.name}</p>
                      <p className="text-sm text-slate-600">{c.body}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 ml-4">{timeAgo(c.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResearchPage() {
  const [researchPosts, setResearchPosts] = useState<ResearchPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState<string[]>([]);
  const [paidOnly, setPaidOnly] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [isProf, setIsProf] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const showLoginPrompt = (action: string) => {
    setLoginPrompt(action);
    setTimeout(() => setLoginPrompt(null), 3000);
  };

  useEffect(() => {
    if (isLoggedIn()) {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        setIsProf(user.is_professor);
      }
      const token = localStorage.getItem("token");
      if (token) {
        fetch(`${API_URL}/api/posts/liked`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.ok ? res.json() : [])
          .then((ids: string[]) => setLikedIds(new Set(ids)))
          .catch(() => {});
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (domainFilter) params.set("field", domainFilter);
      if (skillFilter.length > 0) params.set("tech", skillFilter.join(","));
      params.set("category", "both");
      params.set("page_size", "50");
      const res = await fetch(`${API_URL}/api/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResearchPosts(data.posts || []);
      }
    } catch {
      // backend may not be running
    } finally {
      setLoading(false);
    }
  }, [search, domainFilter, skillFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeFilterTags: { label: string; onClear: () => void }[] = [];
  if (domainFilter) activeFilterTags.push({ label: DOMAIN_LABELS[domainFilter], onClear: () => setDomainFilter("") });
  if (departmentFilter) activeFilterTags.push({ label: departmentFilter, onClear: () => setDepartmentFilter("") });
  skillFilter.forEach((s) => activeFilterTags.push({ label: s, onClear: () => setSkillFilter(skillFilter.filter((x) => x !== s)) }));
  if (paidOnly) activeFilterTags.push({ label: "Paid only", onClear: () => setPaidOnly(false) });

  return (
    <div className="space-y-6 relative">
      {/* Login prompt toast */}
      {loginPrompt && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm px-6 py-3 rounded-xl shadow-lg animate-fade-in flex items-center gap-2">
          <Link href="/login" className="underline font-medium">Sign in</Link>
          <span>to {loginPrompt}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Research</h1>
          <p className="text-sm text-slate-500">Find research opportunities and projects</p>
        </div>
        {isProf && (
          <Link
            href="/research/new"
            className="bg-[#5D0096] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#865DA4] transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            Post Research Project
          </Link>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        <ResearchFilterSidebar
          domainFilter={domainFilter} setDomainFilter={setDomainFilter}
          skillFilter={skillFilter} setSkillFilter={setSkillFilter}
          paidOnly={paidOnly} setPaidOnly={setPaidOnly}
          departmentFilter={departmentFilter} setDepartmentFilter={setDepartmentFilter}
        />

        <div className="flex-1 min-w-0 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search research projects..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#5D0096] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
          </div>

          {/* Active filter tags */}
          {activeFilterTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeFilterTags.map((tag) => (
                <span
                  key={tag.label}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-50 text-[#5D0096] font-medium"
                >
                  {tag.label}
                  <button onClick={tag.onClear} className="hover:text-purple-900">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Post list */}
          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading...</div>
          ) : researchPosts.length === 0 ? (
            <div className="text-center py-16">
              <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No research projects yet</p>
              <p className="text-sm text-slate-400 mt-1">Research opportunities posted by professors will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {researchPosts.map((post) => (
                <ResearchPostCard key={post.id} post={post} onLoginPrompt={showLoginPrompt} initialLiked={likedIds.has(post.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
