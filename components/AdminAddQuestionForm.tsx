"use client";

import { useMemo, useState } from "react";
import {
  cellsToAnswerKey,
  cellsToPlayerPattern,
  type AnswerCell,
} from "@/lib/answerPattern";
import AnswerBlanks from "@/components/AnswerBlanks";

interface AdminAddQuestionFormProps {
  action: (formData: FormData) => void | Promise<void>;
}

function createCell(char = "", visible = false): AnswerCell {
  return { char, visible };
}

export default function AdminAddQuestionForm({
  action,
}: AdminAddQuestionFormProps) {
  const [cells, setCells] = useState<AnswerCell[]>([createCell()]);

  const answerKey = useMemo(() => cellsToAnswerKey(cells), [cells]);
  const playerPattern = useMemo(() => cellsToPlayerPattern(cells), [cells]);
  const hasValidCells = cells.length > 0 && cells.every((cell) => cell.char.length === 1);

  function updateCell(index: number, patch: Partial<AnswerCell>) {
    setCells((current) =>
      current.map((cell, cellIndex) =>
        cellIndex === index ? { ...cell, ...patch } : cell
      )
    );
  }

  function addCell() {
    setCells((current) => [...current, createCell()]);
  }

  function removeCell(index: number) {
    setCells((current) =>
      current.length === 1 ? current : current.filter((_, i) => i !== index)
    );
  }

  function importAnswer(value: string) {
    const nextCells = value.split("").map((char) => createCell(char, false));
    if (nextCells.length === 0) {
      setCells([createCell()]);
      return;
    }

    setCells(nextCells);
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
          Build Answer (letter by letter)
        </label>
        <p className="text-xs text-slate-500 mb-3">
          Enter each character, then choose whether players see it as a hint or
          must fill it in. Example: for <span className="font-mono">137K</span>,
          hide 1-3-7 and show <span className="font-mono">K</span>. For{" "}
          <span className="font-mono">mango and orange</span>, show{" "}
          <span className="font-mono">and</span> and hide the rest.
        </p>

        <div className="rounded-xl border border-white/10 bg-[#0A0E17]/60 p-3">
          <div className="flex flex-wrap gap-2">
            {cells.map((cell, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-[#0A0E17] p-2"
              >
                <input
                  type="text"
                  value={cell.char}
                  maxLength={1}
                  placeholder="?"
                  onChange={(event) => {
                    const nextChar = event.target.value.slice(-1);
                    updateCell(index, { char: nextChar });
                  }}
                  className="size-10 rounded-lg border border-white/10 bg-[#172238] text-center text-base font-bold uppercase text-white focus:border-[#4A72FF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => updateCell(index, { visible: !cell.visible })}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    cell.visible
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-700/40 text-slate-400 border border-white/10"
                  }`}
                >
                  {cell.visible ? "Show" : "Blank"}
                </button>
                <button
                  type="button"
                  onClick={() => removeCell(index)}
                  disabled={cells.length === 1}
                  className="text-[10px] text-red-400 hover:text-red-300 disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addCell}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
            >
              + Add letter
            </button>
            <button
              type="button"
              onClick={() => setCells((current) => [...current, createCell(" ", false)])}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
            >
              + Add space
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
          Quick import
        </label>
        <input
          type="text"
          placeholder='Paste full answer, e.g. "mango and orange"'
          onChange={(event) => importAnswer(event.target.value)}
          className="w-full bg-[#0A0E17] border border-white/10 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A72FF]/50 transition-all"
        />
        <p className="text-xs text-slate-500 mt-1">
          Imported letters start as blanks. Toggle the ones you want shown (like
          &quot;K&quot; or &quot;and&quot;).
        </p>
      </div>

      {hasValidCells ? (
        <div className="rounded-xl border border-white/10 bg-[#0A0E17]/60 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
            Player preview
          </p>
          <p className="text-xs text-slate-500 mb-2 font-mono">{answerKey}</p>
          <AnswerBlanks pattern={playerPattern} onChange={() => {}} disabled />
        </div>
      ) : null}

      <input type="hidden" name="answerCells" value={JSON.stringify(cells)} />

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
          Question Text
        </label>
        <textarea
          name="questionText"
          required
          rows={4}
          placeholder="Type the question prompt here..."
          className="w-full bg-[#0A0E17] border border-white/10 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A72FF]/50 resize-none transition-all"
        />
      </div>

      <p className="text-xs text-slate-500">
        Order is assigned automatically when you save.
      </p>

      <button
        type="submit"
        disabled={!hasValidCells}
        className="w-full bg-gradient-to-r from-[#4A72FF] to-[#8C52FF] text-white font-medium text-sm py-3 px-4 rounded-xl hover:shadow-[0_0_20px_rgba(74,114,255,0.4)] transition-all cursor-pointer border-0 mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Save Question
      </button>
    </form>
  );
}
