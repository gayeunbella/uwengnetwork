"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { isLoggedIn } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
};

type UserInfo = {
  id: string;
  name: string;
  department: string;
};

function timeAgo(dateStr: string) {
  const date = new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
  const diff = Date.now() - date.getTime();
  if (diff < 0) return "now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ConversationPage() {
  const { userId } = useParams<{ userId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<UserInfo | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoggedIn()) return;
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try { setCurrentUserId(JSON.parse(userStr).id); } catch { /* */ }
    }

    // Fetch user info
    fetch(`${API_URL}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setOtherUser(d); })
      .catch(() => {});

    // Fetch messages
    fetch(`${API_URL}/api/messages/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setMessages(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/messages/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: text.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setText("");
      }
    } catch { /* ignore */ }
    setSending(false);
  };

  if (!isLoggedIn()) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Sign in to send messages</p>
        <Link href="/login" className="text-sm text-[#5D0096] font-medium hover:underline mt-2 inline-block">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <Link href="/messages" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        {otherUser && (
          <>
            <div className="w-10 h-10 rounded-full bg-purple-100 text-[#5D0096] flex items-center justify-center text-sm font-bold">
              {otherUser.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{otherUser.name}</p>
              <p className="text-xs text-slate-500">{otherUser.department}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading ? (
          <p className="text-center text-slate-400 text-sm py-10">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-10">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMine
                    ? "bg-[#5D0096] text-white rounded-br-md"
                    : "bg-slate-100 text-slate-800 rounded-bl-md"
                }`}>
                  <p>{msg.body}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-slate-400"}`}>
                    {timeAgo(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 pt-4 flex gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-[#5D0096] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="px-5 py-3 rounded-xl bg-[#5D0096] text-white hover:bg-[#865DA4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
