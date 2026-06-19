import { NextResponse } from "next/server";
import { users } from "@/lib/mockUsers";
import bcrypt from "bcryptjs";
import { validateRegisterServer } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input using server-side validation
    const validationErrors = validateRegisterServer(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    const { indexNumber, name, password } = body;

    // Check if user already exists
    const existingUser = users.find(
      (u) => u.indexNumber === indexNumber
    );

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Index number already registered",
          errors: [
            {
              field: "indexNumber",
              message: "This index number is already in use",
            },
          ],
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create new user (in production, this would be saved to database)
    const newUser = {
      id: users.length + 1,
      indexNumber,
      name,
      password: hashedPassword,
    };

    users.push(newUser);

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user: {
          id: newUser.id,
          indexNumber: newUser.indexNumber,
          name: newUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}