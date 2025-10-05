import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default withAuth({
  loginPage: "/login",
});

export const config = {
  matcher: ["/panel/:path*"],
};
