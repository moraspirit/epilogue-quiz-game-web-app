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

    if (data.nextLevelUuid) {
      navigate(`/quiz/${data.nextLevelUuid}`);
      return "quiz";
    }

    navigate("/login");
    return "login";
  } catch {
    navigate("/login");
    return "login";
  }
}
