"use client";

import { useEffect, useRef, useState } from "react";
import type { AnswerBlankSegment } from "@/lib/answerPattern";

interface AnswerBlanksProps {
  pattern: AnswerBlankSegment[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function getBlankSegmentLengths(pattern: AnswerBlankSegment[]): number[] {
  return pattern
    .filter(
      (segment): segment is Extract<AnswerBlankSegment, { kind: "blank" }> =>
        segment.kind === "blank"
    )
    .map((segment) => segment.length);
}

function createEmptyCells(blankLengths: number[]): string[][] {
  return blankLengths.map((length) => Array.from({ length }, () => ""));
}

function buildAnswer(
  cells: string[][],
  pattern: AnswerBlankSegment[]
): string {
  if (cells.every((segment) => segment.every((cell) => cell === ""))) {
    return "";
  }

  let blankIndex = 0;
  let result = "";

  for (const segment of pattern) {
    if (segment.kind === "blank") {
      result += cells[blankIndex].join("");
      blankIndex += 1;
    } else if (segment.kind === "fixed") {
      result += segment.text;
    } else {
      result += segment.char;
    }
  }

  return result;
}

function fixedDisplay(text: string): string {
  if (text === " ") {
    return "space";
  }

  return text;
}

export default function AnswerBlanks({
  pattern,
  onChange,
  disabled = false,
}: AnswerBlanksProps) {
  const blankLengths = getBlankSegmentLengths(pattern);
  const [cells, setCells] = useState<string[][]>(() =>
    createEmptyCells(blankLengths)
  );
  const inputRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);

  useEffect(() => {
    const nextCells = createEmptyCells(blankLengths);
    setCells(nextCells);
    inputRefs.current = blankLengths.map((length) =>
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

    if (sanitized && letterIndex < blankLengths[segmentIndex] - 1) {
      focusCell(segmentIndex, letterIndex + 1);
    } else if (
      sanitized &&
      letterIndex === blankLengths[segmentIndex] - 1 &&
      segmentIndex < blankLengths.length - 1
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
        focusCell(segmentIndex - 1, blankLengths[segmentIndex - 1] - 1);
      }
    }
  }

  let blankSegmentIndex = 0;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-3">
      {pattern.map((segment, index) => {
        if (segment.kind === "hidden") {
          return null;
        }

        if (segment.kind === "fixed") {
          return (
            <span
              key={`fixed-${index}`}
              className={
                segment.text.trim() === "" && segment.text.includes(" ")
                  ? "px-1 text-sm font-bold text-slate-500"
                  : "px-1 text-xl font-bold text-white"
              }
              aria-hidden="true"
            >
              {fixedDisplay(segment.text)}
            </span>
          );
        }

        const currentSegmentIndex = blankSegmentIndex;
        blankSegmentIndex += 1;

        return (
          <div
            key={`blank-${index}`}
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
