"use client";

import { useEffect, useRef, useState } from "react";
import type { AnswerBlankSegment } from "@/lib/quizProgress";

interface AnswerBlanksProps {
  pattern: AnswerBlankSegment[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function getLetterSegmentLengths(pattern: AnswerBlankSegment[]): number[] {
  return pattern
    .filter(
      (segment): segment is Extract<AnswerBlankSegment, { kind: "letters" }> =>
        segment.kind === "letters"
    )
    .map((segment) => segment.length);
}

function createEmptyCells(letterLengths: number[]): string[][] {
  return letterLengths.map((length) => Array.from({ length }, () => ""));
}

function buildAnswer(
  cells: string[][],
  pattern: AnswerBlankSegment[]
): string {
  if (cells.every((segment) => segment.every((cell) => cell === ""))) {
    return "";
  }

  let cellIndex = 0;
  let result = "";

  for (const segment of pattern) {
    if (segment.kind === "letters") {
      result += cells[cellIndex].join("");
      cellIndex += 1;
    } else if (segment.kind === "dash") {
      result += "-";
    } else if (segment.kind === "space") {
      result += " ";
    }
  }

  return result;
}

export default function AnswerBlanks({
  pattern,
  onChange,
  disabled = false,
}: AnswerBlanksProps) {
  const letterLengths = getLetterSegmentLengths(pattern);
  const [cells, setCells] = useState<string[][]>(() =>
    createEmptyCells(letterLengths)
  );
  const inputRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);

  useEffect(() => {
    const nextCells = createEmptyCells(letterLengths);
    setCells(nextCells);
    inputRefs.current = letterLengths.map((length) =>
      Array.from({ length }, () => null)
    );
    onChange("");
  }, [pattern, onChange]);

  function focusCell(segmentIndex: number, letterIndex: number) {
    inputRefs.current[segmentIndex]?.[letterIndex]?.focus();
  }

  function updateCells(nextCells: string[][]) {
    setCells(nextCells);
    onChange(buildAnswer(nextCells, pattern));
  }

  function handleChange(
    segmentIndex: number,
    letterIndex: number,
    nextValue: string
  ) {
    const nextCells = cells.map((segment) => [...segment]);
    const sanitized = nextValue.length > 1 ? nextValue.slice(-1) : nextValue;

    if (sanitized && /\s/.test(sanitized)) {
      return;
    }

    nextCells[segmentIndex][letterIndex] = sanitized;
    updateCells(nextCells);

    if (sanitized && letterIndex < letterLengths[segmentIndex] - 1) {
      focusCell(segmentIndex, letterIndex + 1);
    } else if (
      sanitized &&
      letterIndex === letterLengths[segmentIndex] - 1 &&
      segmentIndex < letterLengths.length - 1
    ) {
      focusCell(segmentIndex + 1, 0);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    segmentIndex: number,
    letterIndex: number
  ) {
    if (event.key === "Backspace") {
      if (cells[segmentIndex][letterIndex]) {
        return;
      }

      if (letterIndex > 0) {
        event.preventDefault();
        const nextCells = cells.map((segment) => [...segment]);
        nextCells[segmentIndex][letterIndex - 1] = "";
        updateCells(nextCells);
        focusCell(segmentIndex, letterIndex - 1);
      } else if (segmentIndex > 0) {
        event.preventDefault();
        focusCell(segmentIndex - 1, letterLengths[segmentIndex - 1] - 1);
      }
    }
  }

  let letterSegmentIndex = 0;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-3">
      {pattern.map((segment, index) => {
        if (segment.kind === "dash") {
          return (
            <span
              key={`dash-${index}`}
              className="px-1 text-xl font-bold text-white"
              aria-hidden="true"
            >
              -
            </span>
          );
        }

        if (segment.kind === "space") {
          return (
            <span
              key={`space-${index}`}
              className="px-1 text-sm font-bold text-slate-500"
              aria-hidden="true"
            >
              space
            </span>
          );
        }

        const currentSegmentIndex = letterSegmentIndex;
        letterSegmentIndex += 1;

        return (
          <div
            key={`letters-${index}`}
            className="flex items-center gap-1.5 sm:gap-2"
          >
            {Array.from({ length: segment.length }).map((_, letterIndex) => (
              <input
                key={`${currentSegmentIndex}-${letterIndex}`}
                ref={(element) => {
                  if (!inputRefs.current[currentSegmentIndex]) {
                    inputRefs.current[currentSegmentIndex] = [];
                  }
                  inputRefs.current[currentSegmentIndex][letterIndex] = element;
                }}
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={1}
                value={cells[currentSegmentIndex]?.[letterIndex] ?? ""}
                disabled={disabled}
                aria-label={`Letter ${letterIndex + 1} of segment ${currentSegmentIndex + 1}`}
                onChange={(event) =>
                  handleChange(
                    currentSegmentIndex,
                    letterIndex,
                    event.target.value
                  )
                }
                onKeyDown={(event) =>
                  handleKeyDown(event, currentSegmentIndex, letterIndex)
                }
                className="size-10 rounded-lg border border-slate-600/55 bg-[#172238] text-center text-base font-bold uppercase text-white focus:border-blue-400 focus:outline-none sm:size-12 sm:text-lg disabled:cursor-not-allowed disabled:opacity-50"
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function isAnswerComplete(
  answer: string,
  pattern: AnswerBlankSegment[]
): boolean {
  if (!answer.trim()) {
    return false;
  }

  let index = 0;

  for (const segment of pattern) {
    if (segment.kind === "letters") {
      const chunk = answer.slice(index, index + segment.length);
      if (chunk.length !== segment.length || /[\s-]/.test(chunk)) {
        return false;
      }
      index += segment.length;
    } else if (segment.kind === "dash") {
      if (answer[index] !== "-") {
        return false;
      }
      index += 1;
    } else if (segment.kind === "space") {
      if (answer[index] !== " ") {
        return false;
      }
      index += 1;
    }
  }

  return index === answer.length;
}
