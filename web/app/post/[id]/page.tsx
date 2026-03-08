"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bookmark, Clock, MessageCircle, ExternalLink, Github } from "lucide-react";

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

type UserPublic = {
  id: string;
  name: string;
  department: string;
  year: string;
  profile_picture: string;
};

type PostPublic = {
  id: string;
  author: UserPublic;
  title: string;
  body: string;
  media: string[];
  project_stage: string;
  category: string;
  tech_stack: string[];
  field: string[];
  created_at: string;
};

type PostAuthorView = PostPublic & {
  view_count: number;
  prof_view_count: number;
  likes: UserPublic[];
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
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

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<PostPublic | PostAuthorView | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setCurrentUserId(JSON.parse(stored).id);
      } catch {}
    }
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/posts/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) return;
        setPost(await res.json());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const res = await fetch(`${API_URL}/api/posts/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setLiked((await res.json()).liked);
    } catch {}
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading...</div>;
  if (notFound) return (
    <div className="text-center py-20">
      <p className="text-slate-500 font-medium">Post not found</p>
      <Link href="/" className="text-[#7E3AF2] text-sm font-medium hover:underline mt-2 inline-block">Back to feed</Link>
    </div>
  );
  if (!post) return null;

  const isAuthor = currentUserId === post.author.id;
  const authorView = isAuthor ? (post as PostAuthorView) : null;
  const { description, meta } = parseBody(post.body);

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-4">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft size={16} />
        Back to feed
      </Link>

      {/* Main post */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        {/* Author */}
        <div className="flex items-center gap-3 mb-5">
          <Link href={`/profile/${post.author.id}`}>
            <div className="w-10 h-10 rounded-full bg-purple-100 text-[#7E3AF2] flex items-center justify-center text-sm font-bold cursor-pointer">
              {post.author.name.charAt(0)}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${post.author.id}`} className="text-sm font-semibold text-slate-900 hover:text-[#7E3AF2] transition-colors">
              {post.author.name}
            </Link>
            <p className="text-xs text-slate-400">{post.author.department} &middot; Year {post.author.year}</p>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
            <Clock size={12} />
            {timeAgo(post.created_at)}
          </span>
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-3">{post.title}</h1>
        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed mb-4">{description}</p>

        {/* Meta info block */}
        {Object.keys(meta).length > 0 && (
          <div className="text-xs text-slate-500 space-y-1.5 mb-4 bg-slate-50 border border-slate-100 rounded-lg p-3">
            {Object.entries(meta).map(([k, v]) => (
              <div key={k} className="flex gap-2 items-start">
                <span className="font-semibold text-slate-600 shrink-0">{k}:</span>
                {(k === "GitHub" || k === "Demo") ? (
                  <a href={v} target="_blank" rel="noopener noreferrer" className="text-[#7E3AF2] hover:underline flex items-center gap-1 break-all">
                    {v} <ExternalLink size={10} className="shrink-0" />
                  </a>
                ) : (
                  <span className="break-words">{v}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className="flex gap-3 mb-4 flex-wrap">
            {post.media.map((url, i) => (
              <img
                key={i}
                src={`${API_URL}${url}`}
                alt=""
                className="rounded-xl max-h-72 object-cover border border-slate-100"
              />
            ))}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[post.project_stage] || "bg-slate-100 text-slate-600"}`}>
            {STAGES[post.project_stage] || post.project_stage}
          </span>
          {post.field.map((f) => (
            <span key={f} className={`text-xs px-2 py-0.5 rounded-full font-medium ${DOMAIN_COLORS[f] || "bg-slate-100 text-slate-600"}`}>
              {DOMAIN_LABELS[f] || f}
            </span>
          ))}
          {post.tech_stack.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{t}</span>
          ))}
        </div>

        {/* GitHub / Demo from meta as icon links */}
        {(meta["GitHub"] || meta["Demo"]) && (
          <div className="flex gap-3 mb-4">
            {meta["GitHub"] && (
              <a href={meta["GitHub"]} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                <Github size={14} /> GitHub
              </a>
            )}
            {meta["Demo"] && (
              <a href={meta["Demo"]} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                <ExternalLink size={14} /> Demo
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        {!isAuthor && (
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            {currentUserId && (
              <Link
                href={`/messages/${post.author.id}`}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#7E3AF2] transition-colors border border-slate-200 px-4 py-2 rounded-lg hover:border-[#7E3AF2]"
              >
                <MessageCircle size={15} />
                Message {post.author.name.split(" ")[0]}
              </Link>
            )}
            <button
              onClick={handleLike}
              title="Let them know you noticed."
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                liked
                  ? "text-[#7E3AF2] bg-purple-50"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Bookmark size={15} fill={liked ? "currentColor" : "none"} />
              {liked ? "Noticed" : "Notice"}
            </button>
          </div>
        )}
      </div>

      {/* Author analytics + who noticed */}
      {isAuthor && authorView && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Post Analytics</h2>

          <div className="flex gap-8">
            <div>
              <p className="text-2xl font-bold text-slate-900">{authorView.view_count}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total views</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#7E3AF2]">{authorView.prof_view_count}</p>
              <p className="text-xs text-slate-400 mt-0.5">Prof views</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{authorView.likes.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Noticed by</p>
            </div>
          </div>

          {authorView.likes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">People who noticed</p>
              <div className="space-y-2">
                {authorView.likes.map((liker) => (
                  <div key={liker.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-[#7E3AF2] flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {liker.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${liker.id}`} className="text-sm font-medium text-slate-900 hover:text-[#7E3AF2] transition-colors">
                        {liker.name}
                      </Link>
                      <p className="text-xs text-slate-400 truncate">{liker.department}</p>
                    </div>
                    <Link
                      href={`/messages/${liker.id}`}
                      className="text-xs font-medium text-[#7E3AF2] hover:underline flex-shrink-0"
                    >
                      Message
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
