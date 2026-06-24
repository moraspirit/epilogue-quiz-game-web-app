"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { navigateToCurrentQuiz, setToken } from "@/lib/authClient";
import { validateLoginForm, ValidationError } from "@/lib/validation";

function QuestIcon() {
  return (
    <img
      src="/moraspirit-logo.png"
      alt="Moraspirit Logo"
      className="size-12 object-contain"
    />
  );
}

function FieldIcon({ type }: { type: "id" | "lock" }) {
  if (type === "lock") {
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
        <rect width="18" height="11" x="3" y="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
      <rect width="18" height="14" x="3" y="5" rx="2" />
      <path d="M7 10h.01" />
      <path d="M11 10h6" />
      <path d="M7 14h4" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [indexNumber, setIndexNumber] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const getFieldError = (field: string) => {
    return errors.find((err) => err.field === field)?.message;
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setMessage(null);

    // Frontend validation
    const validationErrors = validateLoginForm({ indexNumber, password });
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          indexNumber,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: "success",
          text: "Login successful! Redirecting...",
        });
        setToken(data.token);
        setTimeout(async () => {
          await navigateToCurrentQuiz(router.push);
        }, 500);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Login failed. Please try again.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0d1729] text-[var(--text)]">
      <Navbar />

      <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[linear-gradient(115deg,#0d1729_0%,#10172a_58%,#221f4d_100%)] px-3 py-6 sm:px-5 sm:py-12">
        <div className="w-full max-w-sm sm:max-w-[520px] rounded-2xl sm:rounded-3xl border border-white/10 bg-[#172136]/92 p-5 sm:p-9 shadow-2xl shadow-slate-950/35">
          <div className="flex items-center gap-2 sm:gap-3">
            <QuestIcon />
            <div>
              <h1 className="text-lg sm:text-2xl font-black leading-tight text-white">
                Sign In to Epilogue Quiz
              </h1>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-base font-medium text-slate-400">
                Sign in with your index
              </p>
            </div>
          </div>

          <div className="mt-5 sm:mt-8 grid grid-cols-2 rounded-xl sm:rounded-2xl bg-[#141d31] p-1 sm:p-1.5 text-xs sm:text-base font-bold text-slate-400">
            <div className="inline-flex h-9 sm:h-12 items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl bg-[#263149] text-white shadow-lg shadow-slate-950/20">
              <span className="text-lg sm:text-xl">-&gt;</span>
              Login
            </div>
            <Link
              href="/register"
              className="inline-flex h-9 sm:h-12 items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl transition hover:text-white"
            >
              <span className="text-lg sm:text-xl">+</span>
              Register
            </Link>
          </div>

          <form onSubmit={handleLogin} className="mt-5 sm:mt-7 space-y-3 sm:space-y-5">
            {message && (
              <div
                className={`rounded-lg px-4 py-3 text-sm font-medium ${
                  message.type === "success"
                    ? "border border-green-500/50 bg-green-500/10 text-green-400"
                    : "border border-red-500/50 bg-red-500/10 text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            <label className="block">
              <span className="text-xs sm:text-sm font-bold text-slate-400">
                Index Number
              </span>
              <span
                className={`mt-1 sm:mt-2 flex h-9 sm:h-13 items-center gap-2 sm:gap-3 rounded-lg sm:rounded-2xl border px-3 sm:px-4 text-slate-400 transition ${
                  getFieldError("indexNumber")
                    ? "border-red-500/50 bg-red-500/5 focus-within:border-red-400"
                    : "border-slate-600/55 bg-[#172238] focus-within:border-blue-400"
                }`}
              >
                <FieldIcon type="id" />
                <input
                  type="text"
                  placeholder="e.g. CS2024042"
                  value={indexNumber}
                  onChange={(e) => setIndexNumber(e.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm sm:text-lg font-medium text-white outline-none placeholder:text-slate-400"
                />
              </span>
              {getFieldError("indexNumber") && (
                <p className="mt-1 text-xs text-red-400">
                  {getFieldError("indexNumber")}
                </p>
              )}
            </label>

            <label className="block">
              <span className="text-xs sm:text-sm font-bold text-slate-400">
                Password
              </span>
              <span
                className={`mt-1 sm:mt-2 flex h-9 sm:h-13 items-center gap-2 sm:gap-3 rounded-lg sm:rounded-2xl border px-3 sm:px-4 text-slate-400 transition ${
                  getFieldError("password")
                    ? "border-red-500/50 bg-red-500/5 focus-within:border-red-400"
                    : "border-slate-600/55 bg-[#172238] focus-within:border-blue-400"
                }`}
              >
                <FieldIcon type="lock" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm sm:text-lg font-medium text-white outline-none placeholder:text-slate-400"
                />
              </span>
              {getFieldError("password") && (
                <p className="mt-1 text-xs text-red-400">
                  {getFieldError("password")}
                </p>
              )}
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 sm:mt-1 h-10 sm:h-14 w-full rounded-lg sm:rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-base sm:text-lg font-black text-white shadow-xl shadow-blue-950/30 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
