"use client";

import { useEffect, useRef, useState } from "react";

interface AnswerBlanksProps {
  wordLengths: number[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function createEmptyCells(wordLengths: number[]): string[][] {
  return wordLengths.map((length) => Array.from({ length }, () => ""));
}

function buildAnswer(cells: string[][]): string {
  if (cells.every((word) => word.every((cell) => cell === ""))) {
    return "";
  }

  return cells.map((word) => word.join("")).join(" ");
}

export default function AnswerBlanks({
  wordLengths,
  onChange,
  disabled = false,
}: AnswerBlanksProps) {
  const [cells, setCells] = useState<string[][]>(() =>
    createEmptyCells(wordLengths)
  );
  const inputRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);

  useEffect(() => {
    const nextCells = createEmptyCells(wordLengths);
    setCells(nextCells);
    inputRefs.current = wordLengths.map((length) =>
      Array.from({ length }, () => null)
    );
    onChange("");
  }, [wordLengths, onChange]);

  function focusCell(wordIndex: number, letterIndex: number) {
    inputRefs.current[wordIndex]?.[letterIndex]?.focus();
  }

  function updateCells(nextCells: string[][]) {
    setCells(nextCells);
    onChange(buildAnswer(nextCells));
  }

  function handleChange(
    wordIndex: number,
    letterIndex: number,
    nextValue: string
  ) {
    const nextCells = cells.map((word) => [...word]);
    const sanitized = nextValue.length > 1 ? nextValue.slice(-1) : nextValue;

    if (sanitized && /\s/.test(sanitized)) {
      return;
    }

    nextCells[wordIndex][letterIndex] = sanitized;
    updateCells(nextCells);

    if (sanitized && letterIndex < wordLengths[wordIndex] - 1) {
      focusCell(wordIndex, letterIndex + 1);
    } else if (
      sanitized &&
      letterIndex === wordLengths[wordIndex] - 1 &&
      wordIndex < wordLengths.length - 1
    ) {
      focusCell(wordIndex + 1, 0);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    wordIndex: number,
    letterIndex: number
  ) {
    if (event.key === "Backspace") {
      if (cells[wordIndex][letterIndex]) {
        return;
      }

      if (letterIndex > 0) {
        event.preventDefault();
        const nextCells = cells.map((word) => [...word]);
        nextCells[wordIndex][letterIndex - 1] = "";
        updateCells(nextCells);
        focusCell(wordIndex, letterIndex - 1);
      } else if (wordIndex > 0) {
        event.preventDefault();
        focusCell(wordIndex - 1, wordLengths[wordIndex - 1] - 1);
      }
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
      {wordLengths.map((length, wordIndex) => (
        <div key={`word-${wordIndex}`} className="flex items-center gap-2">
          {wordIndex > 0 && (
            <span className="px-1 text-sm font-bold text-slate-500">space</span>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {Array.from({ length }).map((_, letterIndex) => (
              <input
                key={`${wordIndex}-${letterIndex}`}
                ref={(element) => {
                  if (!inputRefs.current[wordIndex]) {
                    inputRefs.current[wordIndex] = [];
                  }
                  inputRefs.current[wordIndex][letterIndex] = element;
                }}
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={1}
                value={cells[wordIndex]?.[letterIndex] ?? ""}
                disabled={disabled}
                aria-label={`Letter ${letterIndex + 1} of word ${wordIndex + 1}`}
                onChange={(event) =>
                  handleChange(wordIndex, letterIndex, event.target.value)
                }
                onKeyDown={(event) =>
                  handleKeyDown(event, wordIndex, letterIndex)
                }
                className="size-10 rounded-lg border border-slate-600/55 bg-[#172238] text-center text-base font-bold uppercase text-white focus:border-blue-400 focus:outline-none sm:size-12 sm:text-lg disabled:cursor-not-allowed disabled:opacity-50"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function isAnswerComplete(
  answer: string,
  wordLengths: number[]
): boolean {
  if (!answer.trim()) {
    return false;
  }

  const words = answer.split(" ");

  if (words.length !== wordLengths.length) {
    return false;
  }

  return words.every((word, index) => word.length === wordLengths[index]);
}
