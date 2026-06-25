import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/authServer";
import { getNextPlayableQuiz } from "@/lib/quizProgress";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired session" },
        { status: 401 }
      );
    }

    const nextState = await getNextPlayableQuiz(user.id);

    return NextResponse.json({
      success: true,
      ...nextState,
    });
  } catch (error) {
    console.error("Error fetching next quiz question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
