"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const TOKEN_KEY = "token";

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

export function useLoggedIn(): boolean {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  return loggedIn;
}

export function useRedirectIfLoggedIn(): void {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      return;
    }

    void navigateToCurrentQuiz(router.push);
  }, [router]);
}

type QuizNavigationResult = "quiz" | "complete" | "login";

export async function navigateToCurrentQuiz(
  navigate: (path: string) => void
): Promise<QuizNavigationResult> {
  const token = getToken();

  if (!token) {
    navigate("/login");
    return "login";
  }

  try {
    const response = await fetch("/api/quiz/next", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      clearToken();
      navigate("/login");
      return "login";
    }

    if (!response.ok) {
      navigate("/login");
      return "login";
    }

    const data = await response.json();

    if (data.done) {
      navigate("/");
      return "complete";
    }

    navigate("/quiz");
    return "quiz";
  } catch {
    navigate("/login");
    return "login";
  }
}
