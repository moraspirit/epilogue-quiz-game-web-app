"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

function SuccessIcon() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30 text-green-400 mb-6">
      <svg
        className="size-8 animate-bounce"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12.75l6 6 9-13.5"
        />
      </svg>
    </div>
  );
}

function QuestIcon() {
  return (
    <img
      src="/moraspirit-logo.png"
      alt="Moraspirit Logo"
      className="size-12 object-contain"
    />
  );
}

export default function FrontPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#0d1729] text-[var(--text)]">
      <Navbar />

      <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[linear-gradient(115deg,#0d1729_0%,#10172a_58%,#221f4d_100%)] px-3 py-6 sm:px-5 sm:py-12">
        <div className="w-full max-w-sm sm:max-w-[520px] rounded-2xl sm:rounded-3xl border border-white/10 bg-[#172136]/92 p-6 sm:p-9 shadow-2xl shadow-slate-950/35 text-center">
          <SuccessIcon />

          <div className="flex justify-center items-center gap-2 sm:gap-3 mb-6">
            <QuestIcon />
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
                Ready for Epilogue Quiz
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-400">
                You are ready to play!
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
            Welcome to the Epilogue Quiz. Answer every question in order and race to lock your spot on the leaderboard!
          </p>

          <div className="mt-8">
            <Link
              href="/quiz"
              className="inline-flex h-12 sm:h-14 w-full items-center justify-center rounded-lg sm:rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-base sm:text-lg font-black text-white shadow-xl shadow-blue-950/30 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Start Quiz →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
