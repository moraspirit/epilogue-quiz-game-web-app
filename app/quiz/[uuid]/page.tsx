'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AnswerBlanks, { isAnswerComplete } from '@/components/AnswerBlanks';

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
  totalQuestions: number;
  question: Question;
  answerWordLengths: number[];
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [level, setLevel] = useState<QuizLevel | null>(null);
  const [blankKey, setBlankKey] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{
    message: string;
    type: 'success' | 'error' | null;
  }>({ message: '', type: null });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [error, setError] = useState('');

  const goToNextStep = useCallback(
    async (token: string) => {
      const nextRes = await fetch('/api/quiz/next', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nextData = await nextRes.json();

      if (nextData.done) {
        setScore(nextData.score);
        setTotalQuestions(nextData.totalQuestions);
        setQuizComplete(true);
        return;
      }

      if (nextData.nextLevelUuid) {
        router.push(`/quiz/${nextData.nextLevelUuid}`);
        return;
      }
    },
    [router]
  );

  const fetchLevel = useCallback(async () => {
    try {
      setLoading(true);
      setFeedback({ message: '', type: null });
      setAnswer('');
      setBlankKey((key) => key + 1);

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

      const data = await response.json();

      if (response.status === 409 && data.alreadyCompleted) {
        await goToNextStep(token);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch quiz');
      }

      setLevel(data.level);
      if (typeof data.score === "number") {
        setScore(data.score);
      }
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [uuid, router, goToNextStep]);

  useEffect(() => {
    fetchLevel();
  }, [fetchLevel]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!level) return;

    const wordLengths = level.answerWordLengths ?? [];
    const answerReady =
      wordLengths.length > 0
        ? isAnswerComplete(answer, wordLengths)
        : answer.trim().length > 0;

    if (!answerReady) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/quiz/${uuid}/answer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer: answer.trim(),
          questionId: level.question.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit answer');
      }

      if (data.correct) {
        setFeedback({ message: 'Correct answer!', type: 'success' });
        if (typeof data.score === 'number') {
          setScore(data.score);
        }
      } else {
        setFeedback({ message: 'Wrong answer.', type: 'error' });
        setAnswer('');
        setBlankKey((key) => key + 1);
        return;
      }

      if (data.quizComplete) {
        setScore(data.score);
        setTotalQuestions(data.totalQuestions);
        setTimeout(() => {
          setQuizComplete(true);
        }, 1200);
        return;
      }

      setTimeout(async () => {
        if (data.hasMoreQuestionsInLevel) {
          await fetchLevel();
          return;
        }

        if (token) {
          await goToNextStep(token);
        }
      }, 1200);
    } catch (err) {
      setFeedback({
        message: err instanceof Error ? err.message : 'An error occurred',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const wordLengths = level?.answerWordLengths ?? [];
  const answerReady =
    wordLengths.length > 0
      ? isAnswerComplete(answer, wordLengths)
      : answer.trim().length > 0;
  const inputsDisabled = submitting;
  const submitDisabled = inputsDisabled || !answerReady;

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

  if (quizComplete) {
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
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">Epilogue Quiz Complete!</h1>
            <p className="text-slate-300 font-medium mb-1">You have answered all the questions.</p>
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

  return (
    <main className="min-h-screen overflow-hidden bg-[#0d1729] text-[var(--text)]">
      <Navbar />

      <section className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center bg-[linear-gradient(115deg,#0d1729_0%,#10172a_58%,#221f4d_100%)] px-3 py-6 sm:px-5 sm:py-12">
        <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#172136]/92 p-5 sm:p-9 shadow-2xl shadow-slate-950/35">
          <div className="border-b border-white/10 pb-4 mb-6">
            <h1 className="text-xl sm:text-2xl font-black text-white">{level.title}</h1>
            <p className="mt-2 text-sm text-slate-400">
              Question {level.question.questionOrder} of {level.totalQuestions}
              <span className="mx-2">·</span>
              Score: {score}
            </p>
          </div>

          <div className="bg-[#141d31] border border-white/5 rounded-xl sm:rounded-2xl p-5 sm:p-7 mb-6">
            <h2 className="text-base sm:text-xl font-bold leading-relaxed text-white">
              {level.question.questionText}
            </h2>
          </div>

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

          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <div className="block">
              <span className="text-xs sm:text-sm font-bold text-slate-400">
                Your Answer
              </span>
              {wordLengths.length > 0 ? (
                <AnswerBlanks
                  key={blankKey}
                  wordLengths={wordLengths}
                  onChange={setAnswer}
                  disabled={inputsDisabled}
                />
              ) : (
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={inputsDisabled}
                  autoFocus
                  className="mt-2 flex h-12 sm:h-14 w-full rounded-lg sm:rounded-2xl border border-slate-600/55 bg-[#172238] px-4 text-sm sm:text-lg font-medium text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={submitDisabled}
              className="h-12 sm:h-14 w-full rounded-lg sm:rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-base sm:text-lg font-black text-white shadow-xl shadow-blue-950/30 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
