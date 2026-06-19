import {
  SignJWT,
  jwtVerify,
  JWTPayload,
} from "jose";

const JWT_SECRET =
  process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not defined"
  );
}

const secret = new TextEncoder().encode(
  JWT_SECRET
);

export async function createToken(
  payload: JWTPayload
) {
  return await new SignJWT(payload)
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("1d")
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