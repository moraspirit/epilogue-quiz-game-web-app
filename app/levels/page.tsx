'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface QuizLevel {
  id: number;
  uuid: string;
  title: string;
  levelOrder: number;
  isActive: boolean;
}

export default function LevelsPage() {
  const [levels, setLevels] = useState<QuizLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch all levels from database
    const fetchLevels = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/levels', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setLevels(data.levels);
        }
      } catch (err) {
        console.error('Error fetching levels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLevels();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--text)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)] mb-4"></div>
          <p className="text-xl">Loading levels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      {/* Header */}
      <div className="border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Quiz Levels</h1>
            <p className="text-gray-400">Complete all levels to win!</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {levels.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">No levels available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {levels.map((level) => (
              <div
                key={level.id}
                className="group p-6 rounded-2xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--secondary)]/5 hover:border-[var(--primary)]/50 transition-all hover:shadow-lg hover:shadow-[var(--primary)]/20"
              >
                <div className="mb-4">
                  <div className="inline-block px-3 py-1 bg-[var(--primary)]/20 rounded-full mb-3">
                    <span className="text-sm font-semibold text-[var(--primary)]">Level {level.levelOrder}</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-[var(--primary)] transition">
                    {level.title}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {level.isActive ? '✅ Active' : '🔒 Locked'}
                  </p>
                </div>

                <Link href={`/quiz/${level.uuid}`}>
                  <button className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-lg hover:opacity-90 transition group-hover:shadow-lg group-hover:shadow-[var(--primary)]/30">
                    Start Level →
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
