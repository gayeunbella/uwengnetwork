import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[#5D0096]">
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-10 leading-[1.1]">
          Connecting<br />
          <span className="text-[#D0B4E7]">
            UWaterloo Engineering
          </span>
        </h1>

        <p className="text-lg md:text-xl text-[#DFDFDF] max-w-2xl mx-auto mb-12 leading-relaxed">
          The network for Waterloo engineers to share projects, find collaborators, and connect with professors.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-3 bg-white text-[#5D0096] px-10 py-4 rounded-2xl font-bold text-lg hover:bg-[#DFDFDF] transition-all shadow-lg shadow-black/10 hover:shadow-black/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          Sign In
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>

        <p className="text-sm text-[#DFDFDF]/60 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#C2A8F0] hover:text-white font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
