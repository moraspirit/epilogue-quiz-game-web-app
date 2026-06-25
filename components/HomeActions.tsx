"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { navigateToCurrentQuiz, useLoggedIn } from "@/lib/authClient";

export default function HomeActions() {
  const router = useRouter();
  const loggedIn = useLoggedIn();

  async function handleContinueQuiz() {
    await navigateToCurrentQuiz(router.push);
  }

  return (
    <div className="mt-10 flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row">
      {loggedIn ? (
        <button
          type="button"
          onClick={handleContinueQuiz}
          className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-7 text-base font-bold text-white shadow-xl shadow-blue-500/20 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Continue Quiz
          <span className="ml-3 text-xl">→</span>
        </button>
      ) : (
        <Link
          href="/register"
          className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-7 text-base font-bold text-white shadow-xl shadow-blue-500/20 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Register to compete
          <span className="ml-3 text-xl">→</span>
        </Link>
      )}
      <a
        href="https://epilogue.moraspirit.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/8 px-7 text-base font-bold text-white transition hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-violet-300"
      >
        <span className="mr-3 text-[var(--accent)]">★</span>
        Buy an Epilogue Ticket
      </a>
    </div>
  );
}
