export type AnswerCell = {
  char: string;
  visible: boolean;
};

export type AnswerBlankSegment =
  | { kind: "blank"; length: number }
  | { kind: "fixed"; text: string }
  | { kind: "hidden"; char: string };

type LegacyBlankSegment =
  | { kind: "letters"; length: number }
  | { kind: "separator"; char: string; visible: boolean };

export function cellsToAnswerKey(cells: AnswerCell[]): string {
  return cells.map((cell) => cell.char).join("");
}

export function cellsToPlayerPattern(cells: AnswerCell[]): AnswerBlankSegment[] {
  const segments: AnswerBlankSegment[] = [];
  let blankRun = 0;
  let fixedRun = "";

  const flushBlank = () => {
    if (blankRun > 0) {
      segments.push({ kind: "blank", length: blankRun });
      blankRun = 0;
    }
  };

  const flushFixed = () => {
    if (fixedRun.length > 0) {
      segments.push({ kind: "fixed", text: fixedRun });
      fixedRun = "";
    }
  };

  for (const cell of cells) {
    if (cell.visible) {
      flushBlank();
      fixedRun += cell.char;
      continue;
    }

    if (/[a-zA-Z0-9]/.test(cell.char)) {
      flushFixed();
      blankRun += 1;
      continue;
    }

    flushFixed();
    flushBlank();
    segments.push({ kind: "hidden", char: cell.char });
  }

  flushBlank();
  flushFixed();
  return segments;
}

function isAnswerCellArray(value: unknown): value is AnswerCell[] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  return value.every(
    (cell) =>
      typeof cell === "object" &&
      cell !== null &&
      typeof cell.char === "string" &&
      cell.char.length === 1 &&
      typeof cell.visible === "boolean"
  );
}

function isLegacyPattern(value: unknown): value is LegacyBlankSegment[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((segment) => {
    if (typeof segment !== "object" || segment === null) {
      return false;
    }

    if (segment.kind === "letters") {
      return typeof segment.length === "number" && segment.length > 0;
    }

    if (segment.kind === "separator") {
      return (
        typeof segment.char === "string" &&
        segment.char.length === 1 &&
        typeof segment.visible === "boolean"
      );
    }

    return false;
  });
}

function convertLegacyToPlayerPattern(
  pattern: LegacyBlankSegment[]
): AnswerBlankSegment[] {
  const segments: AnswerBlankSegment[] = [];

  for (const segment of pattern) {
    if (segment.kind === "letters") {
      segments.push({ kind: "blank", length: segment.length });
      continue;
    }

    if (segment.kind === "separator") {
      if (segment.visible) {
        segments.push({ kind: "fixed", text: segment.char });
      } else {
        segments.push({ kind: "hidden", char: segment.char });
      }
    }
  }

  return segments;
}

export function answerKeyToDefaultCells(answerKey: string): AnswerCell[] {
  return answerKey.split("").map((char) => ({
    char,
    visible: false,
  }));
}

export function resolveAnswerCells(
  answerKey: string,
  storedPattern: unknown
): AnswerCell[] {
  if (isAnswerCellArray(storedPattern)) {
    const storedKey = cellsToAnswerKey(storedPattern);
    if (storedKey === answerKey) {
      return storedPattern;
    }
  }

  return answerKeyToDefaultCells(answerKey);
}

export function resolvePlayerPattern(
  answerKey: string,
  storedPattern: unknown
): AnswerBlankSegment[] {
  if (isAnswerCellArray(storedPattern)) {
    return cellsToPlayerPattern(storedPattern);
  }

  if (isLegacyPattern(storedPattern)) {
    return convertLegacyToPlayerPattern(storedPattern);
  }

  if (answerKey.length > 0) {
    return [{ kind: "blank", length: answerKey.length }];
  }

  return [];
}

/** @deprecated Use resolvePlayerPattern */
export function resolveAnswerPattern(
  answerKey: string,
  storedPattern: unknown
): AnswerBlankSegment[] {
  return resolvePlayerPattern(answerKey, storedPattern);
}

export function answersMatch(
  userAnswer: string,
  answerKey: string,
  normalize: (value: string) => string
): boolean {
  return normalize(userAnswer) === normalize(answerKey);
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
    if (segment.kind === "blank") {
      const chunk = answer.slice(index, index + segment.length);
      if (chunk.length !== segment.length || /[^a-zA-Z0-9]/.test(chunk)) {
        return false;
      }
      index += segment.length;
      continue;
    }

    if (segment.kind === "hidden") {
      if (answer[index] !== segment.char) {
        return false;
      }
      index += 1;
      continue;
    }

    if (answer.slice(index, index + segment.text.length) !== segment.text) {
      return false;
    }

    index += segment.text.length;
  }

  return index === answer.length;
}

export function parseCellsFromForm(formData: FormData): AnswerCell[] {
  const raw = formData.get("answerCells");
  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (isAnswerCellArray(parsed)) {
      return parsed;
    }
  } catch {
    return [];
  }

  return [];
}

export function parseQuestionAnswerFromForm(formData: FormData): {
  answerKey: string;
  answerPattern: AnswerCell[];
} {
  const cells = parseCellsFromForm(formData);
  if (cells.length === 0) {
    throw new Error("Answer must contain at least one character.");
  }

  return {
    answerKey: cellsToAnswerKey(cells),
    answerPattern: cells,
  };
}
