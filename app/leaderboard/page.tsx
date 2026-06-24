"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

interface LeaderboardEntry {
  id: number;
  name: string;
  indexNumber: string;
  level: number;
  score: number;
  status: "Playing" | "Completed" | "Idle";
  rank: number;
}

function TrophyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-32 text-yellow-500"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  );
}

function LeaderboardRow({
  entry,
  highlight = false,
}: {
  entry: LeaderboardEntry;
  highlight?: boolean;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-green-400";
      case "Playing":
        return "text-blue-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <tr
      className={`border-b border-white/5 transition hover:bg-white/5 ${
        highlight ? "bg-blue-500/10" : ""
      }`}
    >
      <td className="px-4 py-4 text-sm font-bold text-white sm:px-6">
        {entry.rank}
      </td>
      <td className="px-4 py-4 sm:px-6">
        <div>
          <p className="text-sm font-bold text-white">{entry.name}</p>
          <p className="text-xs text-slate-400">#{entry.indexNumber}</p>
        </div>
      </td>
      <td className="px-4 py-4 sm:px-6">
        <span
          className={`text-xs font-semibold ${getStatusColor(entry.status)}`}
        >
          {entry.status}
        </span>
      </td>
      <td className="px-4 py-4 text-sm font-bold text-blue-400 sm:px-6">
        L{entry.level}
      </td>
      <td className="px-4 py-4 text-right text-sm font-bold text-white sm:px-6">
        {entry.score}
      </td>
    </tr>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/leaderboard", { headers });

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const data = await response.json();
      setLeaderboard(data.data || []);
      setCurrentUser(data.currentUser || null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Leaderboard error:", err);
    } finally {
      setLoading(false);
    }
  }

  const champion = leaderboard[0];

  return (
    <main className="min-h-screen bg-[#0d1729] text-white">
      <Navbar />

      <section className="min-h-[calc(100vh-5rem)] bg-[linear-gradient(115deg,#0d1729_0%,#10172a_58%,#221f4d_100%)] px-3 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-start justify-between sm:mb-12">
            <div>
              <h1 className="text-3xl font-black text-white sm:text-4xl">
                Leaderboard
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-400 sm:text-base">
                Top 20 players — first to finish wins the prize.
              </p>
            </div>
            <div className="hidden sm:block">
              <TrophyIcon />
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-slate-400">Loading leaderboard...</div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="text-slate-400">No players yet</div>
            </div>
          ) : (
            <>
              {champion && (
                <div className="mb-8 rounded-2xl border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-900/10 p-6 sm:p-8">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="rounded-lg bg-yellow-500/20 px-3 py-2 text-xs font-bold text-yellow-400 sm:px-4">
                      👑 CHAMPION
                    </div>
                    <div className="text-3xl font-black text-yellow-400 sm:text-4xl">
                      #1
                    </div>
                  </div>
                  <div className="mt-4">
                    <h2 className="text-xl font-black text-white sm:text-2xl">
                      {champion.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      #{champion.indexNumber}
                    </p>
                    <div className="mt-3 flex gap-4 text-sm sm:text-base">
                      <div>
                        <span className="font-bold text-blue-400">Lv </span>
                        <span className="font-bold text-white">
                          {champion.level}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-green-400">Score </span>
                        <span className="font-bold text-white">
                          {champion.score}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#172136]/60 backdrop-blur">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#0d1729]/50">
                      <th className="px-4 py-4 text-left text-xs font-bold text-slate-400 sm:px-6">
                        #
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-slate-400 sm:px-6">
                        PLAYER
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-slate-400 sm:px-6">
                        STATUS
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-slate-400 sm:px-6">
                        LEVEL
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-slate-400 sm:px-6">
                        SCORE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <LeaderboardRow key={entry.id} entry={entry} />
                    ))}
                  </tbody>
                </table>
              </div>

              {currentUser && (
                <div className="mt-8">
                  <p className="mb-3 text-sm font-semibold text-slate-400">
                    Your rank
                  </p>
                  <div className="overflow-x-auto rounded-2xl border border-blue-500/30 bg-[#172136]/60 backdrop-blur">
                    <table className="w-full">
                      <tbody>
                        <LeaderboardRow entry={currentUser} highlight />
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
