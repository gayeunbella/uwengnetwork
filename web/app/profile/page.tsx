"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Mail, Calendar, BookOpen, Edit2 } from "lucide-react";
import { isLoggedIn } from "@/lib/auth";

type UserData = {
  id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  bio: string;
  profile_picture: string;
  is_verified: boolean;
  is_professor: boolean;
  created_at: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const li = isLoggedIn();
    setLoggedIn(li);
    if (li) {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
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
        <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#7E3AF2] transition-colors">
          <Edit2 size={16} />
          Edit Profile
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-purple-100 text-[#7E3AF2] flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {user.name.charAt(0)}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
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
                <Mail size={14} />
                {user.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <BookOpen size={14} />
                {user.department}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar size={14} />
                {user.is_professor ? "Faculty" : `Year ${user.year}`}
              </div>
            </div>

            {user.bio && (
              <p className="text-sm text-slate-600 mt-4">{user.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* User's posts section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Your Dev Logs</h3>
        <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
          <p className="text-slate-400 text-sm">No posts yet. Share what you&apos;re building!</p>
          <Link
            href="/post/new"
            className="inline-block mt-3 text-sm text-[#7E3AF2] font-medium hover:underline"
          >
            Create your first post
          </Link>
        </div>
      </div>
    </div>
  );
}
