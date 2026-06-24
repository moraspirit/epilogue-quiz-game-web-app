import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";
import { getNextPlayableLevel } from "@/lib/quizProgress";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const userId = Number(payload.id);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 });
    }

    const nextState = await getNextPlayableLevel(userId);

    return NextResponse.json({
      success: true,
      ...nextState,
    });
  } catch (error) {
    console.error("Error fetching next quiz level:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
