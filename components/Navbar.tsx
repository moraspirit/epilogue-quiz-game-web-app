import Link from "next/link";
import QuizNavLink from "@/components/QuizNavLink";

function BrandIcon({ className = "size-11" }: { className?: string }) {
  return (
    <img
      src="/moraspirit-logo.png"
      alt="Moraspirit Logo"
      className={`${className} object-contain`}
    />
  );
}

function NavIcon({ type }: { type: "quiz" | "leaderboard" }) {
  if (type === "leaderboard") {
    return (
      <svg
        aria-hidden="true"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
        <path d="M5 5H3v3a4 4 0 0 0 4 4" />
        <path d="M19 5h2v3a4 4 0 0 1-4 4" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m14 3 7 7-4 4-7-7 4-4Z" />
      <path d="m5 11 8 8" />
      <path d="m2 14 6 6" />
      <path d="m7 9-2 2" />
      <path d="m15 17-2 2" />
    </svg>
  );
}

export default function Navbar() {
  return (
    <header className="border-b border-white/10 bg-[#111a2d]/90 backdrop-blur">
      <nav className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <BrandIcon />
          <span className="text-xl font-bold tracking-normal">
            Epilogue<span className="text-[var(--primary)]">Quiz</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-semibold text-slate-300 md:flex">
          <QuizNavLink />
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 transition hover:text-white"
          >
            <NavIcon type="leaderboard" />
            Leaderboard
          </Link>
          <Link
            href="/register"
            className="rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-6 py-3 text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02]"
          >
            Join
          </Link>
        </div>
      </nav>
    </header>
  );
}
