import Link from "next/link";
import Navbar from "@/components/Navbar";

const highlights = [
  {
    icon: "5",
    title: "5 Levels",
    description: "Three questions each with rising difficulty.",
    tone: "text-[var(--primary)]",
  },
  {
    icon: "↟",
    title: "Answer in order",
    description: "Unlock every stage by clearing the one before it.",
    tone: "text-[var(--secondary)]",
  },
  {
    icon: "★",
    title: "Free event ticket",
    description: "The first player to finish all questions wins the prize.",
    tone: "text-[var(--accent)]",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--text)]">
      <Navbar />

      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(139,92,246,0.22),transparent_28%)]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center text-center">
            <p className="mb-5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300">
              Live quiz competition
            </p>

            <h1 className="text-5xl font-black leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Race the levels.
              <span className="block bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
                Claim the crown.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-slate-300 sm:text-xl">
              Epilogue Quiz is a live, gamified quiz battle. Answer in order,
              climb the leaderboard, and be the first to finish for a free
              event ticket.
            </p>

            <div className="mt-10 flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-7 text-base font-bold text-white shadow-xl shadow-blue-500/20 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Register to compete
                <span className="ml-3 text-xl">→</span>
              </Link>
              <a
                href="#leaderboard"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/8 px-7 text-base font-bold text-white transition hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-violet-300"
              >
                <span className="mr-3 text-[var(--accent)]">★</span>
                View leaderboard
              </a>
            </div>
          </div>

          <div className="grid gap-4 pb-2 pt-10 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-slate-950/20 backdrop-blur sm:p-6"
              >
                <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-white/8">
                  <span className={`text-2xl font-black ${item.tone}`}>
                    {item.icon}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{item.title}</h2>
                <p className="mt-2 text-base leading-6 text-slate-300">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
