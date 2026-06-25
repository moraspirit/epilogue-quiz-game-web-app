'use client';

import { moveQuizLevelOrder } from './actions';

type QuizLevelItem = {
  id: number;
  title: string;
  levelOrder: number;
};

export default function QuizLevelOrderPanel({
  levels,
}: {
  levels: QuizLevelItem[];
}) {
  if (levels.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#181D2F]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-white mb-1">Quiz Order</h2>
      <p className="text-xs text-slate-400 mb-4">
        Use the arrows to change the order players see the quizzes.
      </p>

      <div className="space-y-2">
        {levels.map((level, index) => (
          <div
            key={level.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0A0E17]/60 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-white">{level.title}</p>
              <p className="text-xs text-slate-400">Position {index + 1}</p>
            </div>

            <div className="flex items-center gap-2">
              <form action={moveQuizLevelOrder}>
                <input type="hidden" name="quizLevelId" value={level.id} />
                <input type="hidden" name="direction" value="up" />
                <button
                  type="submit"
                  disabled={index === 0}
                  aria-label={`Move ${level.title} up`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ↑
                </button>
              </form>

              <form action={moveQuizLevelOrder}>
                <input type="hidden" name="quizLevelId" value={level.id} />
                <input type="hidden" name="direction" value="down" />
                <button
                  type="submit"
                  disabled={index === levels.length - 1}
                  aria-label={`Move ${level.title} down`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ↓
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
