import {
  SignJWT,
  jwtVerify,
  JWTPayload,
} from "jose";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-for-development-only-replace-in-production";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const secret = new TextEncoder().encode(JWT_SECRET);

export async function createToken(
  payload: JWTPayload
) {
  return await new SignJWT(payload)
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyToken(
  token: string
) {
  const { payload } =
    await jwtVerify(
      token,
      secret
    );

  return payload;
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
}
