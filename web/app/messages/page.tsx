"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { isLoggedIn } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ThreadPreview = {
  other_user: {
    id: string;
    name: string;
    department: string;
    profile_picture: string;
  };
  last_message: {
    body: string;
    created_at: string;
  };
  unread_count: number;
};

function timeAgo(dateStr: string) {
  const date = new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
  const diff = Date.now() - date.getTime();
  if (diff < 0) return "now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days <= 10) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<ThreadPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const li = isLoggedIn();
    setLoggedIn(li);
    if (!li) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setThreads(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loggedIn) {
    return (
      <div className="text-center py-20">
        <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Sign in to view messages</p>
        <Link href="/login" className="text-sm text-[#5D0096] font-medium hover:underline mt-2 inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-500">Direct messages with other engineers</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading messages...</div>
      ) : threads.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No messages yet</p>
          <p className="text-sm text-slate-400 mt-1">Start a conversation from someone&apos;s profile</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {threads.map((thread) => (
            <Link
              key={thread.other_user.id}
              href={`/messages/${thread.other_user.id}`}
              className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 text-[#5D0096] flex items-center justify-center text-sm font-bold flex-shrink-0">
                {thread.other_user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{thread.other_user.name}</p>
                  <span className="text-xs text-slate-400">{timeAgo(thread.last_message.created_at)}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{thread.last_message.body}</p>
              </div>
              {thread.unread_count > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#5D0096] text-white text-xs flex items-center justify-center flex-shrink-0">
                  {thread.unread_count}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
