"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearLegacyBrowserToken } from "@/lib/authSession";

type QuizNavigationResult = "quiz" | "complete" | "login";

export function useLoggedIn(): boolean {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    clearLegacyBrowserToken();

    fetch("/api/auth/session", { credentials: "include" })
      .then((response) => setLoggedIn(response.ok))
      .catch(() => setLoggedIn(false));
  }, []);

  return loggedIn;
}

export function useRedirectIfLoggedIn(): void {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((response) => {
        if (response.ok) {
          void navigateToCurrentQuiz(router.push);
        }
      })
      .catch(() => {
        // Stay on login/register page.
      });
  }, [router]);
}

export async function logout(): Promise<void> {
  clearLegacyBrowserToken();

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Best effort.
  }
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
  });

  if (response.status === 401) {
    await logout();
  }

  return response;
}

export async function navigateToCurrentQuiz(
  navigate: (path: string) => void
): Promise<QuizNavigationResult> {
  try {
    const response = await authFetch("/api/quiz/next");

    if (response.status === 401) {
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

export async function requireSession(
  navigate: (path: string) => void
): Promise<boolean> {
  try {
    const response = await authFetch("/api/auth/session");
    if (!response.ok) {
      navigate("/login");
      return false;
    }

    return true;
  } catch {
    navigate("/login");
    return false;
  }
}
