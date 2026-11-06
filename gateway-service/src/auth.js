const { createRemoteJWKSet, jwtVerify } = require("jose");

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
  throw new Error("AUTH0_DOMAIN and AUTH0_AUDIENCE environment variables are required");
}

const issuer = `https://${AUTH0_DOMAIN}/`;
const jwks = createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`));

async function requireAuth(req, res, next) {
  const header = req.header("Authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: AUTH0_AUDIENCE,
    });
    req.user = { sub: payload.sub };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
