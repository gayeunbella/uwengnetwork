"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, BookOpen, Calendar, MessageCircle, Bookmark, Clock, Edit2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STAGES: Record<string, string> = {
  idea: "Idea", early_prototype: "Prototype", working_prototype: "MVP",
  polished: "Production", shipped: "Shipped",
};
const STAGE_COLORS: Record<string, string> = {
  idea: "bg-blue-100 text-blue-700", early_prototype: "bg-amber-100 text-amber-700",
  working_prototype: "bg-emerald-100 text-emerald-700", polished: "bg-purple-100 text-purple-700",
  shipped: "bg-green-100 text-green-700",
};
const DOMAIN_LABELS: Record<string, string> = {
  ai_ml: "AI / ML", healthcare: "Healthcare", sustainability: "Sustainability",
  robotics: "Robotics", embedded: "Embedded", fintech: "Fintech",
  web: "Web", mobile: "Mobile", data: "Data", security: "Security", other: "Other",
};
const DOMAIN_COLORS: Record<string, string> = {
  ai_ml: "bg-violet-100 text-violet-700", healthcare: "bg-rose-100 text-rose-700",
  sustainability: "bg-green-100 text-green-700", robotics: "bg-orange-100 text-orange-700",
  embedded: "bg-yellow-100 text-yellow-700", fintech: "bg-cyan-100 text-cyan-700",
  web: "bg-sky-100 text-sky-700", mobile: "bg-indigo-100 text-indigo-700",
  data: "bg-teal-100 text-teal-700", security: "bg-red-100 text-red-700",
  other: "bg-slate-100 text-slate-600",
};

type UserData = {
  id: string; name: string; email: string; department: string;
  year: string; bio: string; profile_picture: string;
  is_verified: boolean; is_professor: boolean; created_at: string;
};

type Post = {
  id: string; title: string; body: string; project_stage: string;
  category: string; tech_stack: string[]; field: string[];
  media: string[]; created_at: string;
  author: { id: string; name: string; department: string; year: string; profile_picture: string };
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function parseBodyPreview(body: string) {
  return body.split("\n\n---\n")[0];
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setCurrentUserId(JSON.parse(stored).id); } catch {}
    }
    const token = localStorage.getItem("token");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${API_URL}/api/users/${id}`, { headers }).then(async (r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.ok ? r.json() : null;
      }),
      fetch(`${API_URL}/api/users/${id}/posts?page_size=20`, { headers })
        .then((r) => r.ok ? r.json() : { posts: [] }),
    ])
      .then(([userData, postsData]) => {
        setUser(userData);
        setPosts(postsData?.posts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20 text-slate-400">Loading...</div>;
  if (notFound) return (
    <div className="text-center py-20">
      <p className="text-slate-500 font-medium">User not found</p>
      <Link href="/" className="text-[#7E3AF2] text-sm font-medium hover:underline mt-2 inline-block">Back to feed</Link>
    </div>
  );
  if (!user) return null;

  const isOwnProfile = currentUserId === user.id;

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft size={16} />
        Back
      </Link>

      {/* Profile card */}
      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-purple-100 text-[#7E3AF2] flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                  {user.is_verified && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Verified</span>
                  )}
                  {user.is_professor && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Professor</span>
                  )}
                </div>
                <div className="space-y-1.5 mt-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Mail size={14} />{user.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <BookOpen size={14} />{user.department}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar size={14} />{user.is_professor ? "Faculty" : `Year ${user.year}`}
                  </div>
                </div>
                {user.bio && (
                  <p className="text-sm text-slate-600 mt-4 max-w-lg">{user.bio}</p>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {isOwnProfile ? (
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#7E3AF2] transition-colors border border-slate-200 px-4 py-2 rounded-lg hover:border-[#7E3AF2]"
                  >
                    <Edit2 size={14} />
                    Edit Profile
                  </Link>
                ) : currentUserId && (
                  <Link
                    href={`/messages/${user.id}`}
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#7E3AF2] transition-colors border border-slate-200 px-4 py-2 rounded-lg hover:border-[#7E3AF2]"
                  >
                    <MessageCircle size={14} />
                    Message
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
          Dev Logs ({posts.length})
        </h3>
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            <p className="text-slate-400 text-sm">No posts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`} className="block">
                <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">{post.title}</h4>
                    <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0 ml-3">
                      <Clock size={11} />{timeAgo(post.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{parseBodyPreview(post.body)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[post.project_stage] || "bg-slate-100 text-slate-600"}`}>
                      {STAGES[post.project_stage] || post.project_stage}
                    </span>
                    {post.field.map((f) => (
                      <span key={f} className={`text-xs px-2 py-0.5 rounded-full font-medium ${DOMAIN_COLORS[f] || "bg-slate-100 text-slate-600"}`}>
                        {DOMAIN_LABELS[f] || f}
                      </span>
                    ))}
                    {post.tech_stack.slice(0, 3).map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{t}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
