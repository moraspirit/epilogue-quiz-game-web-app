import { NextResponse } from "next/server";
import {
  isValidIndexNumber,
  normalizeIndexNumber,
  ValidationRules,
} from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawIndexNumber =
      typeof body?.indexNumber === "string" ? body.indexNumber : "";

    const indexNumber = normalizeIndexNumber(rawIndexNumber);

    if (!isValidIndexNumber(indexNumber)) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: ValidationRules.indexNumber.errorMessage,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      indexNumber,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        valid: false,
        message: "Invalid request",
      },
      { status: 400 }
    );
  }
}
