"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { isLoggedIn } from "@/lib/auth";
import { Search, Plus, Eye, Clock, ThumbsUp, MessageSquare, Share2, Mail, Users, FlaskConical, X, Check } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STAGES: Record<string, string> = {
  idea: "Idea",
  early_prototype: "Prototype",
  working_prototype: "MVP",
  polished: "Production",
  shipped: "Shipped",
};

const STAGE_COLORS: Record<string, string> = {
  idea: "bg-blue-100 text-blue-700",
  early_prototype: "bg-amber-100 text-amber-700",
  working_prototype: "bg-emerald-100 text-emerald-700",
  polished: "bg-purple-100 text-purple-700",
  shipped: "bg-green-100 text-green-700",
};

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

const POPULAR_TECH = [
  "React", "Next.js", "Python", "TypeScript", "TensorFlow", "PyTorch",
  "Node.js", "C++", "Rust", "Arduino", "ROS", "Flutter", "Swift", "Go",
];

const QUICK_FILTERS: { label: string; params: Record<string, string> }[] = [
  { label: "1st/2nd Year Projects", params: { year: "1,2" } },
  { label: "ECE + Embedded", params: { department: "Electrical and Computer Engineering", field: "embedded" } },
  { label: "AI/ML Research", params: { field: "ai_ml", category: "research" } },
  { label: "Open to Collaborate", params: { looking_for: "collaborators" } },
  { label: "Prof Lab Projects", params: { prof_lab: "true" } },
];

type Post = {
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

function timeAgo(dateStr: string) {
  if (!dateStr) return "";
  const normalized = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return "";
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

function FilterSidebar({
  stageFilter, setStageFilter,
  domainFilter, setDomainFilter,
  techFilter, setTechFilter,
  openToCollab, setOpenToCollab,
  profLabOnly, setProfLabOnly,
  onQuickFilter,
}: {
  stageFilter: string;
  setStageFilter: (v: string) => void;
  domainFilter: string;
  setDomainFilter: (v: string) => void;
  techFilter: string[];
  setTechFilter: (v: string[]) => void;
  openToCollab: boolean;
  setOpenToCollab: (v: boolean) => void;
  profLabOnly: boolean;
  setProfLabOnly: (v: boolean) => void;
  onQuickFilter: (params: Record<string, string>) => void;
}) {
  const activeCount = [stageFilter, domainFilter, openToCollab, profLabOnly, techFilter.length > 0].filter(Boolean).length;

  return (
    <div className="w-60 shrink-0 space-y-5">
      {activeCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">{activeCount} filter{activeCount > 1 ? "s" : ""} active</span>
          <button
            onClick={() => {
              setStageFilter("");
              setDomainFilter("");
              setTechFilter([]);
              setOpenToCollab(false);
              setProfLabOnly(false);
            }}
            className="text-xs text-[#5D0096] font-medium hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Stage</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(STAGES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStageFilter(stageFilter === key ? "" : key)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                stageFilter === key
                  ? STAGE_COLORS[key]
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {label}
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
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tech Stack</p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TECH.map((tech) => {
            const active = techFilter.includes(tech);
            return (
              <button
                key={tech}
                onClick={() =>
                  setTechFilter(
                    active ? techFilter.filter((t) => t !== tech) : [...techFilter, tech]
                  )
                }
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  active
                    ? "bg-[#5D0096] text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {tech}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={openToCollab}
            onChange={(e) => setOpenToCollab(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#5D0096] focus:ring-purple-200 accent-[#5D0096]"
          />
          <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 flex items-center gap-1.5">
            <Users size={13} />
            Open to collaborators
          </span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={profLabOnly}
            onChange={(e) => setProfLabOnly(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#5D0096] focus:ring-purple-200 accent-[#5D0096]"
          />
          <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 flex items-center gap-1.5">
            <FlaskConical size={13} />
            From prof labs only
          </span>
        </label>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Filters</p>
        <div className="space-y-1">
          {QUICK_FILTERS.map((qf) => (
            <button
              key={qf.label}
              onClick={() => onQuickFilter(qf.params)}
              className="w-full text-left text-xs px-3 py-2 rounded-lg text-slate-600 hover:bg-purple-50 hover:text-[#5D0096] transition-colors font-medium"
            >
              {qf.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, onLoginPrompt, initialLiked }: { post: Post; onLoginPrompt: (msg: string) => void; initialLiked?: boolean }) {
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
            <p className="text-xs text-slate-500">{post.author.department} &middot; Year {post.author.year}</p>
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

        {/* Tags */}
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[post.project_stage] || "bg-slate-100 text-slate-600"}`}>
            {STAGES[post.project_stage] || post.project_stage}
          </span>
          {post.field.map((f) => (
            <span key={f} className={`text-xs px-2 py-0.5 rounded-full font-medium ${DOMAIN_COLORS[f] || "bg-slate-100 text-slate-600"}`}>
              {DOMAIN_LABELS[f] || f}
            </span>
          ))}
          {post.tech_stack.slice(0, 4).map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {t}
            </span>
          ))}
          {post.tech_stack.length > 4 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
              +{post.tech_stack.length - 4}
            </span>
          )}
        </div>

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

export default function ProjectsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [techFilter, setTechFilter] = useState<string[]>([]);
  const [openToCollab, setOpenToCollab] = useState(false);
  const [profLabOnly, setProfLabOnly] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const showLoginPrompt = (action: string) => {
    setLoginPrompt(action);
    setTimeout(() => setLoginPrompt(null), 3000);
  };

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const handler = () => setLoggedIn(isLoggedIn());
    window.addEventListener("auth-change", handler);
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_URL}/api/posts/liked`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.ok ? res.json() : [])
        .then((ids: string[]) => setLikedIds(new Set(ids)))
        .catch(() => {});
    }
    return () => window.removeEventListener("auth-change", handler);
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (stageFilter) params.set("stage", stageFilter);
      if (domainFilter) params.set("field", domainFilter);
      if (techFilter.length > 0) params.set("tech", techFilter.join(","));
      if (openToCollab) params.set("looking_for", "collaborators");
      if (profLabOnly) params.set("prof_lab", "true");
      params.set("page_size", "50");
      params.set("exclude_categories", "question,news,discussion");
      const res = await fetch(`${API_URL}/api/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {
      // backend may not be running
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter, domainFilter, techFilter, openToCollab, profLabOnly]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleQuickFilter = (params: Record<string, string>) => {
    setStageFilter("");
    setTechFilter([]);
    setOpenToCollab(false);
    setProfLabOnly(false);
    if (params.field) setDomainFilter(params.field);
    else setDomainFilter("");
    if (params.looking_for === "collaborators") setOpenToCollab(true);
    if (params.prof_lab === "true") setProfLabOnly(true);
  };

  const activeFilterTags: { label: string; onClear: () => void }[] = [];
  if (stageFilter) activeFilterTags.push({ label: STAGES[stageFilter], onClear: () => setStageFilter("") });
  if (domainFilter) activeFilterTags.push({ label: DOMAIN_LABELS[domainFilter], onClear: () => setDomainFilter("") });
  techFilter.forEach((t) => activeFilterTags.push({ label: t, onClear: () => setTechFilter(techFilter.filter((x) => x !== t)) }));
  if (openToCollab) activeFilterTags.push({ label: "Open to collaborate", onClear: () => setOpenToCollab(false) });
  if (profLabOnly) activeFilterTags.push({ label: "Prof labs only", onClear: () => setProfLabOnly(false) });

  return (
    <div className="space-y-6 relative">
      {/* Login prompt toast */}
      {loginPrompt && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm px-6 py-3 rounded-xl shadow-lg animate-fade-in flex items-center gap-2">
          <Link href="/login" className="underline font-medium">Sign in</Link>
          <span>to {loginPrompt}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500">Browse what UW Engineers are building</p>
        </div>
        {loggedIn && (
          <Link
            href="/post/new"
            className="bg-[#5D0096] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#865DA4] transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            New Project
          </Link>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        <FilterSidebar
          stageFilter={stageFilter} setStageFilter={setStageFilter}
          domainFilter={domainFilter} setDomainFilter={setDomainFilter}
          techFilter={techFilter} setTechFilter={setTechFilter}
          openToCollab={openToCollab} setOpenToCollab={setOpenToCollab}
          profLabOnly={profLabOnly} setProfLabOnly={setProfLabOnly}
          onQuickFilter={handleQuickFilter}
        />

        {/* Feed column */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
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
            <div className="text-center py-16 text-slate-400">Loading projects...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <Eye className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No projects yet</p>
              <p className="text-sm text-slate-400 mt-1">Be the first to share what you&apos;re building</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onLoginPrompt={showLoginPrompt} initialLiked={likedIds.has(post.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
