"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Mail, Calendar, BookOpen, Edit2, Clock } from "lucide-react";
import { isLoggedIn } from "@/lib/auth";

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
  tech_stack: string[]; field: string[]; created_at: string;
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

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const li = isLoggedIn();
    setLoggedIn(li);
    if (!li) return;

    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUser(u);

        // Fetch own posts
        const token = localStorage.getItem("token");
        setPostsLoading(true);
        fetch(`${API_URL}/api/users/${u.id}/posts?page_size=20`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
          .then((r) => r.ok ? r.json() : { posts: [] })
          .then((data) => setPosts(data.posts || []))
          .catch(() => {})
          .finally(() => setPostsLoading(false));
      } catch {}
    }
  }, []);

  if (!loggedIn) {
    return (
      <div className="text-center py-20">
        <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Sign in to view your profile</p>
        <Link href="/login" className="text-sm text-[#7E3AF2] font-medium hover:underline mt-2 inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <Link
          href="/settings"
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#7E3AF2] transition-colors"
        >
          <Edit2 size={16} />
          Edit Profile
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-purple-100 text-[#7E3AF2] flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {user.name.charAt(0)}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              {user.is_verified && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  Verified
                </span>
              )}
              {user.is_professor && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                  Professor
                </span>
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
              <p className="text-sm text-slate-600 mt-4">{user.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Own posts */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Your Dev Logs</h3>
        {postsLoading ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            <p className="text-slate-400 text-sm">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            <p className="text-slate-400 text-sm">No posts yet. Share what you&apos;re building!</p>
            <Link
              href="/post/new"
              className="inline-block mt-3 text-sm text-[#7E3AF2] font-medium hover:underline"
            >
              Create your first post
            </Link>
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
