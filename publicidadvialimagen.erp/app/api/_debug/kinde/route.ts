export async function GET() {
  const mask = (v?: string) =>
    v ? v.slice(0, 3) + "***" + v.slice(-4) : "MISSING";

  return Response.json({
    KINDE_CLIENT_ID: process.env.KINDE_CLIENT_ID ? "OK" : "MISSING",
    KINDE_CLIENT_SECRET: mask(process.env.KINDE_CLIENT_SECRET),
    KINDE_ISSUER_URL: process.env.KINDE_ISSUER_URL,
    KINDE_SITE_URL: process.env.KINDE_SITE_URL,
    KINDE_POST_LOGIN_REDIRECT_URL: process.env.KINDE_POST_LOGIN_REDIRECT_URL,
    KINDE_POST_LOGOUT_REDIRECT_URL: process.env.KINDE_POST_LOGOUT_REDIRECT_URL,
  });
}
