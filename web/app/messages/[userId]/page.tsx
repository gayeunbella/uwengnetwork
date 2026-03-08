"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type UserPublic = {
  id: string;
  name: string;
  department: string;
  year: string;
  profile_picture: string;
};

type Message = {
  id: string;
  sender: UserPublic;
  receiver: UserPublic;
  body: string;
  is_read: boolean;
  created_at: string;
};

function timeStr(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DMThreadPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [otherUser, setOtherUser] = useState<UserPublic | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token || !stored) { setNotLoggedIn(true); setLoading(false); return; }
    const me = JSON.parse(stored);
    setCurrentUserId(me.id);

    Promise.all([
      fetch(`${API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.ok ? r.json() : null),
      fetch(`${API_URL}/api/messages/${userId}?page_size=50`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.ok ? r.json() : []),
    ])
      .then(([user, msgs]) => {
        setOtherUser(user);
        setMessages(Array.isArray(msgs) ? msgs : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!body.trim() || sending) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/messages/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setBody("");
      }
    } catch {}
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (notLoggedIn) return (
    <div className="text-center py-20">
      <p className="text-slate-500 font-medium">Log in to view messages</p>
      <Link href="/login" className="text-[#7E3AF2] text-sm font-medium hover:underline mt-2 inline-block">Log In</Link>
    </div>
  );

  if (loading) return <div className="text-center py-20 text-slate-400">Loading...</div>;

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-9rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/messages" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        {otherUser && (
          <>
            <div className="w-9 h-9 rounded-full bg-purple-100 text-[#7E3AF2] flex items-center justify-center text-sm font-bold flex-shrink-0">
              {otherUser.name.charAt(0)}
            </div>
            <div>
              <Link href={`/profile/${otherUser.id}`} className="text-sm font-semibold text-slate-900 hover:text-[#7E3AF2] transition-colors">
                {otherUser.name}
              </Link>
              <p className="text-xs text-slate-400">{otherUser.department}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-xl p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-slate-400 text-sm">No messages yet</p>
              <p className="text-slate-400 text-xs mt-1">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender.id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md xl:max-w-lg`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? "bg-emerald-100 text-emerald-900 rounded-br-sm"
                        : "bg-slate-100 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    {msg.body}
                  </div>
                  <p className={`text-xs text-slate-400 mt-1 ${isOwn ? "text-right" : "text-left"}`}>
                    {timeStr(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2 items-end">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          rows={1}
          maxLength={5000}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-[#7E3AF2] focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none"
          style={{ minHeight: "44px", maxHeight: "120px" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!body.trim() || sending}
          className="bg-[#7E3AF2] text-white p-3 rounded-xl hover:bg-[#6D28D9] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
