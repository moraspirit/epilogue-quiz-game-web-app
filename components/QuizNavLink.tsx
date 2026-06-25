"use client";

import { useRouter } from "next/navigation";
import { navigateToCurrentQuiz } from "@/lib/authClient";

function NavIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m14 3 7 7-4 4-7-7 4-4Z" />
      <path d="m5 11 8 8" />
      <path d="m2 14 6 6" />
      <path d="m7 9-2 2" />
      <path d="m15 17-2 2" />
    </svg>
  );
}

interface QuizNavLinkProps {
  onClick?: () => void;
  className?: string;
}

export default function QuizNavLink({
  onClick,
  className = "",
}: QuizNavLinkProps) {
  const router = useRouter();

  async function handleClick(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();

    onClick?.();

    await navigateToCurrentQuiz(router.push);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 transition hover:text-white ${className}`}
    >
      <NavIcon />
      Quiz
    </button>
  );
}