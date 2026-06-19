'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

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

      if (data.correct) {
        setFeedback({ message: '✅ Correct!', type: 'success' });

        // Check if level is complete
        if (data.levelComplete) {
          if (data.winner) {
            setIsWinner(true);
            setFeedback({ message: '🏆 You are a WINNER!', type: 'success' });
          } else {
            setLevelComplete(true);
            setFeedback({
              message: '🎉 Level Complete! Next level unlocked.',
              type: 'success',
            });
          }
        } else if (isLastQuestion) {
          // More questions in this level
          setTimeout(() => {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setAnswer('');
            setFeedback({ message: '', type: null });
          }, 1500);
        } else {
          // Move to next question
          setTimeout(() => {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setAnswer('');
            setFeedback({ message: '', type: null });
          }, 1500);
        }
      } else {
        setFeedback({ message: '❌ Wrong answer. Try again!', type: 'error' });
        setAnswer('');
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
      <div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={() => router.push('/')}>Go Home</button>
      </div>
    );
  }

  if (!level) {
    return (
      <div>
        <p>Quiz not found</p>
      </div>
    );
  }

  if (isWinner) {
    return (
      <div>
        <h1>� You Completed All Levels!</h1>
        <p>Congratulations! You have successfully completed all quiz levels.</p>
        <p>Winners will be announced later.</p>
        <button onClick={() => router.push('/')}>Go Home</button>
      </div>
    );
  }

  if (levelComplete) {
    return (
      <div>
        <h1>🎉 Level Complete!</h1>
        <p>{level.title} is complete.</p>
        <button onClick={() => router.push('/')}>Back to Levels</button>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1>{level.title}</h1>
        <p>
          Level {level.levelOrder} - Question {currentQuestionIndex + 1} of{' '}
          {level.questions.length}
        </p>
      </div>

      <div>
        <div>
          <h2>{currentQuestion?.questionText}</h2>

          {feedback.message && (
            <div>
              <p>{feedback.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmitAnswer}>
            <input
              type="text"
              placeholder="Enter your answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={submitting}
              autoFocus
            />
            <button type="submit" disabled={submitting || !answer.trim()}>
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </form>

          <div>
            <p>
              Question {currentQuestionIndex + 1}/{level.questions.length}
            </p>
            <div>
              {level.questions.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-block',
                    margin: '5px',
                    padding: '10px',
                    border:
                      idx === currentQuestionIndex
                        ? '2px solid blue'
                        : '1px solid gray',
                  }}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
