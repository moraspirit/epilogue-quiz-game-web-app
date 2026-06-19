import {
  SignJWT,
  jwtVerify,
  JWTPayload,
} from "jose";

const secret = new TextEncoder().encode(
  "my-secret-key"
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