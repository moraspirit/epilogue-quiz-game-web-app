"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QuizNavLink from "@/components/QuizNavLink";

function BrandIcon({
  className = "size-11",
}: {
  className?: string;
}) {
  return (
    <img
      src="/moraspirit-logo.png"
      alt="Moraspirit Logo"
      className={`${className} object-contain`}
    />
  );
}

function LeaderboardIcon() {
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

function HamburgerIcon({
  open,
}: {
  open: boolean;
}) {
  return (
    <svg
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      viewBox="0 0 24 24"
    >
      {open ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6h16M4 12h16M4 18h16"
        />
      )}
    </svg>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b border-white/10 backdrop-blur transition-all duration-300 ${
        open
          ? "bg-[#111a2d]/40 opacity-40 pointer-events-none"
        : "bg-[#111a2d]/90 opacity-100"
         }`}
      >
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">

          {/* Logo */}

          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center gap-3"
          >
            <BrandIcon />

            <span className="text-xl font-bold text-white">
              Epilogue
              <span className="text-[var(--primary)]">
                Quiz
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}

          <div className="hidden items-center gap-7 text-sm font-semibold text-slate-300 md:flex">

            <QuizNavLink />

            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 transition hover:text-white"
            >
              <LeaderboardIcon />
              Leaderboard
            </Link>

            <Link
              href="/register"
              className="rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-6 py-3 text-white shadow-lg shadow-violet-500/20 transition duration-300 hover:scale-105"
            >
              Join
            </Link>

          </div>

          {/* Mobile Hamburger */}

          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-white transition hover:bg-white/10 md:hidden"
            aria-label="Toggle navigation"
          >
            <HamburgerIcon open={open} />
          </button>

        </nav>
      </header>

      {/* Dark Overlay */}

      <div
        onClick={closeMenu}
        className={`fixed inset-0 z-[55] bg-black/75 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open
            ? "opacity-100 pointer-events-auto"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-[60] h-screen w-80 max-w-[85vw]
        transform border-l border-white/10 bg-[#111a2d]
        shadow-2xl transition-transform duration-300 ease-in-out
        md:hidden
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <BrandIcon className="size-10" />

            <div>
              <h2 className="text-lg font-bold text-white">
                Epilogue
                <span className="text-[var(--primary)]">Quiz</span>
              </h2>

              <p className="text-xs text-slate-400">
                MoraSpirit Competition
              </p>
            </div>
          </div>

          <button
            onClick={closeMenu}
            className="rounded-lg p-2 text-white hover:bg-white/10"
            aria-label="Close menu"
            title="Close menu"
          >
            <HamburgerIcon open />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-3 p-6">

          <QuizNavLink
            onClick={closeMenu}
            className="flex w-full items-center rounded-xl px-4 py-3 text-base font-medium text-slate-300 transition-all duration-200 hover:bg-white/10 hover:text-white"
          />

          <Link
            href="/leaderboard"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-slate-300 transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            <LeaderboardIcon />
            Leaderboard
          </Link>

          <div className="mt-6">
            <Link
              href="/register"
              onClick={closeMenu}
              className="block rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-6 py-4 text-center font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02]"
            >
              Join Competition
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6 border-t border-white/10 pt-5">
          <p className="text-center text-sm text-slate-400">
            © 2026 Moraspirit
          </p>
        </div>
      </aside>
    </>
  );
}