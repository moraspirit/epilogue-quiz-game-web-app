'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Question {
  id: number;
  questionText: string;
  questionOrder: number;
}

interface QuizLevel {
  id: number;
  uuid: string;
  title: string;
  levelOrder: number;
  questions: Question[];
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [level, setLevel] = useState<QuizLevel | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{
    message: string;
    type: 'success' | 'error' | null;
  }>({ message: '', type: null });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [error, setError] = useState('');

  // Fetch quiz level on mount
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/quiz/${uuid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch quiz');
        }

        const data = await response.json();
        setLevel(data.level);
        
        // Find the first unanswered question
        const answeredIds = new Set(data.progress?.map((p: any) => p.questionId) || []);
        const nextIndex = data.level.questions.findIndex((q: Question) => !answeredIds.has(q.id));
        
        if (nextIndex !== -1) {
          setCurrentQuestionIndex(nextIndex);
        } else {
          // All questions answered, set level complete
          setLevelComplete(true);
          setScore(data.progress?.filter((p: any) => p.isCorrect).length || 0);
          setTotalQuestions(data.level.questions.length);
          if (data.winner) setIsWinner(true);
        }
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [uuid, router]);

  const currentQuestion = level?.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === (level?.questions.length ?? 0) - 1;

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!answer.trim() || !currentQuestion) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/quiz/${uuid}/answer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer: answer.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.correct) {
        setFeedback({ message: '✅ Correct Answer!', type: 'success' });
      } else {
        setFeedback({ message: '❌ Wrong answer.', type: 'error' });
      }

      if (data.levelComplete) {
        setScore(data.score);
        setTotalQuestions(data.totalQuestions);
        
        setTimeout(() => {
          if (data.winner) {
            setIsWinner(true);
          } else {
            setLevelComplete(true);
          }
        }, 1500);
      } else {
        // Move to next question regardless of correct or wrong
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setAnswer('');
          setFeedback({ message: '', type: null });
        }, 1500);
      }
    } catch (err) {
      setFeedback({
        message: err instanceof Error ? err.message : 'An error occurred',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d1729] text-[var(--text)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)] mb-4"></div>
          <p className="text-xl font-medium text-slate-400">Loading quiz level...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#0d1729] text-[var(--text)]">
        <Navbar />
        <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[linear-gradient(115deg,#0d1729_0%,#10172a_58%,#221f4d_100%)] px-3 py-6">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#172136]/92 p-6 sm:p-9 shadow-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mb-6">
              <svg className="size-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Failed to Load Quiz</h2>
            <p className="text-sm text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex h-12 px-6 items-center justify-center rounded-xl bg-white/8 border border-white/10 text-white transition hover:bg-white/12 font-bold"
            >
              Go Home
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!level) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#0d1729] text-[var(--text)]">
        <Navbar />
        <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[linear-gradient(115deg,#0d1729_0%,#10172a_58%,#221f4d_100%)] px-3 py-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#172136]/92 p-6 sm:p-9 shadow-2xl text-center">
            <h2 className="text-xl font-bold text-white mb-2">Quiz Level Not Found</h2>
            <p className="text-sm text-slate-400 mb-6">The requested level does not exist or has been deactivated.</p>
            <button
              onClick={() => router.push('/levels')}
              className="inline-flex h-12 px-6 items-center justify-center rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold transition hover:opacity-90"
            >
              Back to Levels
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (isWinner) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#0d1729] text-[var(--text)]">
        <Navbar />
        <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[linear-gradient(115deg,#0d1729_0%,#10172a_58%,#221f4d_100%)] px-3 py-6">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#172136]/92 p-6 sm:p-9 shadow-2xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-6">
              <svg className="size-12 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-2.25a1.125 1.125 0 00-1.125 1.125v3.375m9 0V9m-9 0V3.75m.75.75h4.5m-5.25 6H7.5m9 0h3.75M12 9a3 3 0 100-6 3 3 0 000 6zM9.75 15.75h4.5" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">🏆 You Completed All Levels!</h1>
            <p className="text-slate-300 font-medium mb-1">Congratulations! You have successfully completed all quiz levels.</p>
            <div className="my-4 inline-block px-4 py-2 bg-[var(--primary)]/20 border border-[var(--primary)] rounded-xl">
              <p className="text-lg font-bold text-[var(--primary)]">Score: {score} / {totalQuestions}</p>
            </div>
            <p className="text-sm text-slate-400 mb-8">Winners will be announced later.</p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex h-12 px-6 items-center justify-center rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold transition hover:opacity-90"
            >
              Go Home
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (levelComplete) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#0d1729] text-[var(--text)]">
        <Navbar />
        <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[linear-gradient(115deg,#0d1729_0%,#10172a_58%,#221f4d_100%)] px-3 py-6">
          <div className="w-full max-w-md rounded-2xl border border-green-500/30 bg-[#172136]/92 p-6 sm:p-9 shadow-2xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30 text-green-400 mb-6">
              <svg className="size-12 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">🎉 Level Complete!</h1>
            <p className="text-slate-300 font-medium mb-4">{level.title} is complete.</p>
            <div className="mb-6 inline-block px-4 py-2 bg-[var(--primary)]/20 border border-[var(--primary)] rounded-xl">
              <p className="text-lg font-bold text-[var(--primary)]">Score: {score} / {totalQuestions}</p>
            </div>
            <button
              onClick={() => router.push('/levels')}
              className="inline-flex h-12 px-6 items-center justify-center rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold transition hover:opacity-90 w-full"
            >
              Back to Levels
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0d1729] text-[var(--text)]">
      <Navbar />

      <section className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center bg-[linear-gradient(115deg,#0d1729_0%,#10172a_58%,#221f4d_100%)] px-3 py-6 sm:px-5 sm:py-12">
        <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#172136]/92 p-5 sm:p-9 shadow-2xl shadow-slate-950/35">
          
          {/* Level details & header */}
          <div className="border-b border-white/10 pb-4 mb-6">
            <span className="inline-block px-3 py-1 bg-[var(--primary)]/20 rounded-full text-xs sm:text-sm font-semibold text-[var(--primary)] mb-2">
              Level {level.levelOrder}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">{level.title}</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Question {currentQuestionIndex + 1} of {level.questions.length}
            </p>
          </div>

          {/* Question Text */}
          <div className="bg-[#141d31] border border-white/5 rounded-xl sm:rounded-2xl p-5 sm:p-7 mb-6">
            <h2 className="text-base sm:text-xl font-bold leading-relaxed text-white">
              {currentQuestion?.questionText}
            </h2>
          </div>

          {/* Feedback messages */}
          {feedback.message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-bold mb-6 border transition-all ${
                feedback.type === 'success'
                  ? 'border-green-500/50 bg-green-500/10 text-green-400'
                  : 'border-red-500/50 bg-red-500/10 text-red-400'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Answer Submit Form */}
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <div className="block">
              <span className="text-xs sm:text-sm font-bold text-slate-400">
                Your Answer
              </span>
              <input
                type="text"
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={submitting}
                autoFocus
                className="mt-2 flex h-12 sm:h-14 w-full rounded-lg sm:rounded-2xl border border-slate-600/55 bg-[#172238] px-4 text-sm sm:text-lg font-medium text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !answer.trim()}
              className="h-12 sm:h-14 w-full rounded-lg sm:rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-base sm:text-lg font-black text-white shadow-xl shadow-blue-950/30 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </form>

          {/* Question Indicator progress bar/dots */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-slate-400 mb-3">
              <span>Progress</span>
              <span>
                {currentQuestionIndex + 1} / {level.questions.length} Questions
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {level.questions.map((_, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = idx < currentQuestionIndex;
                return (
                  <div
                    key={idx}
                    className={`h-9 flex-1 min-w-[32px] max-w-[48px] flex items-center justify-center rounded-lg font-bold border transition ${
                      isCurrent
                        ? 'border-[var(--primary)] bg-[var(--primary)]/20 text-white font-extrabold shadow'
                        : isAnswered
                        ? 'border-green-500/40 bg-green-500/10 text-green-400'
                        : 'border-slate-700 bg-slate-800/40 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exit/Levels button */}
          <div className="mt-8 flex justify-center border-t border-white/5 pt-4">
            <button
              onClick={() => router.push('/levels')}
              className="text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition"
              type="button"
            >
              ← Leave Quiz & Back to Levels
            </button>
          </div>

        </div>
      </section>
    </main>
  );
}
