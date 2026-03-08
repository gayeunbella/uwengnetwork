"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Bookmark, MessageCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  reference_id: string;
  is_read: boolean;
  created_at: string;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setNotLoggedIn(true); setLoading(false); return; }

    fetch(`${API_URL}/api/notifications?page_size=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : { notifications: [] })
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Mark all as read
    fetch(`${API_URL}/api/notifications/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  }, []);

  if (notLoggedIn) return (
    <div className="text-center py-20">
      <p className="text-slate-500 font-medium">Log in to view notifications</p>
      <Link href="/login" className="text-[#7E3AF2] text-sm font-medium hover:underline mt-2 inline-block">Log In</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500">Activity on your posts and messages</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No notifications yet</p>
          <p className="text-sm text-slate-400 mt-1">When someone notices your work or messages you, it appears here</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {notifications.map((n) => {
            const href = n.type === "like"
              ? `/post/${n.reference_id}`
              : n.type === "message"
              ? `/messages/${n.reference_id}`
              : "#";

            return (
              <Link
                key={n.id}
                href={href}
                className={`flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors ${!n.is_read ? "bg-purple-50/30" : ""}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  n.type === "like" ? "bg-purple-100 text-[#7E3AF2]" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {n.type === "like" ? <Bookmark size={15} /> : <MessageCircle size={15} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-[#7E3AF2] flex-shrink-0 mt-2" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
