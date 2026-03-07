"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { isLoggedIn } from "@/lib/auth";
import { Search, Plus, Eye, Clock, Bookmark, Github, ExternalLink, Users, FlaskConical, X } from "lucide-react";

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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Parse metadata appended to body (after ---)
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

function Landing() {
  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          The Verified Engineering Network
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl">
          Connect with Waterloo Engineering experts. AI-powered verification ensures
          every profile is a real student or faculty member.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-[#7E3AF2] font-bold text-3xl mb-1">1.2k+</div>
          <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Verified Experts</div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-[#7E3AF2] font-bold text-3xl mb-1">Eng&apos;28</div>
          <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Top Class Activity</div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-[#7E3AF2] font-bold text-3xl mb-1">99.8%</div>
          <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Bot Protection</div>
        </div>
      </div>

      <div className="p-10 bg-[#7E3AF2] rounded-3xl text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ready to join the network?</h2>
          <p className="opacity-80">Grab your WatCard and get started in 30 seconds.</p>
        </div>
        <Link
          href="/verify"
          className="bg-white text-[#7E3AF2] px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition"
        >
          Verify Now
        </Link>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
      }
    } catch { /* ignore */ }
  };

  const { description, meta } = parseBody(post.body);
  const githubUrl = meta["GitHub"];
  const demoUrl = meta["Demo"];
  const lookingFor = meta["Looking for"];

  return (
    <Link href={`/post/${post.id}`} className="block">
      <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all">
        {/* Author row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-[#7E3AF2] flex items-center justify-center text-xs font-bold">
            {post.author.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{post.author.name}</p>
            <p className="text-xs text-slate-400">{post.author.department} &middot; Year {post.author.year}</p>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock size={12} />
            {timeAgo(post.created_at)}
          </span>
        </div>

        {/* Title + body */}
        <h3 className="font-semibold text-slate-900 mb-1">{post.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-3 mb-3">{description}</p>

        {/* Media thumbnails */}
        {post.media.length > 0 && (
          <div className="flex gap-2 mb-3">
            {post.media.slice(0, 3).map((url, i) => (
              <div key={i} className="w-24 h-20 rounded-lg bg-slate-100 overflow-hidden">
                <img src={`${API_URL}${url}`} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[post.project_stage] || "bg-slate-100 text-slate-600"}`}>
            {STAGES[post.project_stage] || post.project_stage}
          </span>
          {post.field.map((f) => (
            <span key={f} className={`text-xs px-2 py-0.5 rounded-full font-medium ${DOMAIN_COLORS[f] || "bg-slate-100 text-slate-600"}`}>
              {DOMAIN_LABELS[f] || f}
            </span>
          ))}
          {post.tech_stack.slice(0, 3).map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {t}
            </span>
          ))}
        </div>

        {/* Bottom row: looking for + links + like */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {lookingFor && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                {lookingFor}
              </span>
            )}
            {githubUrl && (
              <span className="text-slate-400 hover:text-slate-600" onClick={(e) => e.stopPropagation()}>
                <a href={githubUrl} target="_blank" rel="noopener noreferrer"><Github size={15} /></a>
              </span>
            )}
            {demoUrl && (
              <span className="text-slate-400 hover:text-slate-600" onClick={(e) => e.stopPropagation()}>
                <a href={demoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /></a>
              </span>
            )}
          </div>
          <button
            onClick={handleLike}
            title="Let them know you noticed"
            className={`p-1.5 rounded-lg transition-colors ${
              liked
                ? "text-[#7E3AF2] bg-purple-50"
                : "text-slate-300 hover:text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Bookmark size={18} fill={liked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </Link>
  );
}

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
    <div className="w-60 flex-shrink-0 space-y-5">
      {/* Active filters count + clear */}
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
            className="text-xs text-[#7E3AF2] font-medium hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Stage */}
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

      {/* Domain */}
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

      {/* Tech Stack */}
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
                    ? "bg-[#7E3AF2] text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {tech}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2.5 pt-1">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={openToCollab}
            onChange={(e) => setOpenToCollab(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#7E3AF2] focus:ring-purple-200 accent-[#7E3AF2]"
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
            className="w-4 h-4 rounded border-slate-300 text-[#7E3AF2] focus:ring-purple-200 accent-[#7E3AF2]"
          />
          <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 flex items-center gap-1.5">
            <FlaskConical size={13} />
            From prof labs only
          </span>
        </label>
      </div>

      {/* Quick Filters */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Filters</p>
        <div className="space-y-1">
          {QUICK_FILTERS.map((qf) => (
            <button
              key={qf.label}
              onClick={() => onQuickFilter(qf.params)}
              className="w-full text-left text-xs px-3 py-2 rounded-lg text-slate-600 hover:bg-purple-50 hover:text-[#7E3AF2] transition-colors font-medium"
            >
              {qf.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [techFilter, setTechFilter] = useState<string[]>([]);
  const [openToCollab, setOpenToCollab] = useState(false);
  const [profLabOnly, setProfLabOnly] = useState(false);

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
    // Reset all filters then apply quick filter params
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Discover</h1>
          <p className="text-sm text-slate-500">See what UW Engineers are building</p>
        </div>
        <Link
          href="/post/new"
          className="bg-[#7E3AF2] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#6D28D9] transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          New Post
        </Link>
      </div>

      {/* Two-column layout: filter sidebar + feed */}
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
          </div>

          {/* Active filter tags */}
          {activeFilterTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeFilterTags.map((tag) => (
                <span
                  key={tag.label}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-50 text-[#7E3AF2] font-medium"
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
            <div className="text-center py-16 text-slate-400">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <Eye className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No posts yet</p>
              <p className="text-sm text-slate-400 mt-1">Be the first to share what you&apos;re building</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const handler = () => setLoggedIn(isLoggedIn());
    window.addEventListener("auth-change", handler);
    return () => window.removeEventListener("auth-change", handler);
  }, []);

  return loggedIn ? <Feed /> : <Landing />;
}
