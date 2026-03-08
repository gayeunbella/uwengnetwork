"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Clock, Heart, Github, ExternalLink, Users, Eye,
  Trash2, Loader2, BookOpen, Calendar, Mail, Pencil,
  ThumbsUp, MessageSquare, Share2, Check,
} from "lucide-react";
import { isLoggedIn } from "@/lib/auth";

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

type PostDetail = {
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
    email: string;
    department: string;
    year: string;
    is_professor: boolean;
    profile_picture: string;
  };
  view_count?: number;
  prof_view_count?: number;
  likes?: { id: string; name: string; department: string }[];
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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: string; user: { id: string; name: string; department: string; year: string; profile_picture: string }; body: string; created_at: string }[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn()) {
      const stored = localStorage.getItem("user");
      if (stored) setCurrentUserId(JSON.parse(stored).id);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`${API_URL}/api/posts/${id}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Post not found");
        return res.json();
      })
      .then((data) => {
        setPost(data);
        if (data.liked_by_me) setLiked(true);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const requireAuth = (action: string): boolean => {
    if (!localStorage.getItem("token")) {
      setLoginPrompt(action);
      setTimeout(() => setLoginPrompt(null), 3000);
      return false;
    }
    return true;
  };

  const handleLike = async () => {
    if (!requireAuth("like this post")) return;
    if (!post) return;
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

  const handleDelete = async () => {
    if (!post || !confirm("Are you sure you want to delete this post?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) router.push("/projects");
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  };

  const fetchComments = async () => {
    if (!id) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_URL}/api/posts/${id}/comments`);
      if (res.ok) setComments(await res.json());
    } catch { /* ignore */ }
    setLoadingComments(false);
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(!showComments);
  };

  const handleComment = async () => {
    if (!commentText.trim() || !id) return;
    if (!requireAuth("comment on this post")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/posts/${id}/comments`, {
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
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 text-slate-300 mx-auto animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-medium">{error || "Post not found"}</p>
        <Link href="/projects" className="text-sm text-[#5D0096] font-medium hover:underline mt-2 inline-block">
          Back to Projects
        </Link>
      </div>
    );
  }

  const { description, meta } = parseBody(post.body);
  const githubUrl = meta["GitHub"];
  const demoUrl = meta["Demo"];
  const lookingFor = meta["Looking for"];
  const timeline = meta["Timeline"];
  const projectType = meta["Type"];
  const isOwner = currentUserId === post.author.id;

  // Research project fields
  const lab = meta["Lab"];
  const course = meta["Course"];
  const requiredSkills = meta["Required Skills"];
  const niceToHave = meta["Nice to Have"];
  const hoursPerWeek = meta["Hours/Week"];
  const startDate = meta["Start"];
  const duration = meta["Duration"];
  const compensation = meta["Compensation"];
  const openTo = meta["Open to"];
  const programs = meta["Programs"];
  const applicationMethod = meta["Application"];
  const applyLink = meta["Apply Link"];
  const status = meta["Status"];

  return (
    <div className="max-w-3xl mx-auto py-6 relative">
      {/* Login prompt toast */}
      {loginPrompt && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm px-6 py-3 rounded-xl shadow-lg animate-fade-in flex items-center gap-2">
          <Link href="/login" className="underline font-medium">Sign in</Link>
          <span>to {loginPrompt}</span>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/");
          }
        }}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="space-y-6">
        {/* Header card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          {/* Author + actions */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#5D0096] flex items-center justify-center text-lg font-bold">
                {post.author.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{post.author.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1"><BookOpen size={12} />{post.author.department}</span>
                  <span>&middot;</span>
                  <span>{post.author.is_professor ? "Professor" : `Year ${post.author.year}`}</span>
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/post/${post.id}/edit`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Pencil size={15} />
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{post.title}</h1>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STAGE_COLORS[post.project_stage] || "bg-slate-100 text-slate-600"}`}>
              {STAGES[post.project_stage] || post.project_stage}
            </span>
            {projectType && (
              <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                {projectType}
              </span>
            )}
            {status && (
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                status === "Actively Recruiting" ? "bg-green-100 text-green-700" :
                status === "Waitlist" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                {status}
              </span>
            )}
            {post.field.map((f) => (
              <span key={f} className={`text-xs px-3 py-1 rounded-full font-medium ${DOMAIN_COLORS[f] || "bg-slate-100 text-slate-600"}`}>
                {DOMAIN_LABELS[f] || f}
              </span>
            ))}
          </div>

          {/* Meta info row */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-6">
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              {timeAgo(post.created_at)}
            </span>
            {timeline && (
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                {timeline}
              </span>
            )}
            {lookingFor && (
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <Users size={13} />
                {lookingFor}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="prose prose-slate prose-sm max-w-none">
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{description}</p>
          </div>
        </div>

        {/* Media gallery */}
        {post.media.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Screenshots</h2>
            <div className="grid grid-cols-3 gap-3">
              {post.media.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(`${API_URL}${url}`)}
                  className="aspect-video rounded-xl bg-slate-100 overflow-hidden hover:opacity-90 transition-opacity"
                >
                  <img src={`${API_URL}${url}`} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tech stack */}
        {post.tech_stack.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {post.tech_stack.map((t) => (
                <span key={t} className="text-sm px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Research project details */}
        {(lab || compensation || hoursPerWeek || openTo || requiredSkills) && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-900">Research Details</h2>

            <div className="grid grid-cols-2 gap-4">
              {lab && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Lab</p>
                  <p className="text-sm text-slate-700">{lab}</p>
                </div>
              )}
              {course && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Course</p>
                  <p className="text-sm text-slate-700">{course}</p>
                </div>
              )}
              {compensation && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Compensation</p>
                  <p className="text-sm text-slate-700">{compensation}</p>
                </div>
              )}
              {hoursPerWeek && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Hours / Week</p>
                  <p className="text-sm text-slate-700">{hoursPerWeek}</p>
                </div>
              )}
              {startDate && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Start Date</p>
                  <p className="text-sm text-slate-700">{startDate}</p>
                </div>
              )}
              {duration && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Duration</p>
                  <p className="text-sm text-slate-700">{duration}</p>
                </div>
              )}
              {openTo && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Open To</p>
                  <p className="text-sm text-slate-700">{openTo}</p>
                </div>
              )}
              {programs && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Programs</p>
                  <p className="text-sm text-slate-700">{programs}</p>
                </div>
              )}
            </div>

            {requiredSkills && (
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {requiredSkills.split(", ").map((s) => (
                    <span key={s} className="text-sm px-3 py-1 rounded-lg bg-purple-50 text-purple-700 font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {niceToHave && (
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Nice to Have</p>
                <div className="flex flex-wrap gap-2">
                  {niceToHave.split(", ").map((s) => (
                    <span key={s} className="text-sm px-3 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {applicationMethod && (
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">How to Apply</p>
                {applyLink ? (
                  <a
                    href={applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#5D0096] font-medium hover:underline"
                  >
                    <ExternalLink size={14} />
                    {applicationMethod}
                  </a>
                ) : applicationMethod === "Apply via email" ? (
                  <a
                    href={`mailto:${post.author.email}`}
                    className="inline-flex items-center gap-2 text-sm text-[#5D0096] font-medium hover:underline"
                  >
                    <Mail size={14} />
                    Email {post.author.name}
                  </a>
                ) : (
                  <p className="text-sm text-slate-700">{applicationMethod}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Links */}
        {(githubUrl || demoUrl) && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Links</h2>
            <div className="flex gap-4">
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#5D0096] font-medium transition-colors"
                >
                  <Github size={16} />
                  GitHub Repository
                </a>
              )}
              {demoUrl && (
                <a
                  href={demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#5D0096] font-medium transition-colors"
                >
                  <ExternalLink size={16} />
                  Live Demo
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-2 py-1 flex">
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

        {/* Author stats (owner only) */}
        {isOwner && post.view_count !== undefined && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Your Stats</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-slate-50">
                <div className="text-2xl font-bold text-slate-900">{post.view_count}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                  <Eye size={12} /> Views
                </div>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-50">
                <div className="text-2xl font-bold text-[#5D0096]">{post.prof_view_count}</div>
                <div className="text-xs text-slate-500 mt-1">Prof Views</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-pink-50">
                <div className="text-2xl font-bold text-pink-600">{post.likes?.length || 0}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                  <Heart size={12} /> Likes
                </div>
              </div>
            </div>

            {post.likes && post.likes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 font-medium mb-2">Liked by</p>
                <div className="space-y-2">
                  {post.likes.map((u) => (
                    <div key={u.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-[#5D0096] flex items-center justify-center text-[10px] font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-700">{u.name}</span>
                      <span className="text-xs text-slate-400">{u.department}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
