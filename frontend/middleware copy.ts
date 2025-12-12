import { NextResponse, NextRequest } from "next/server";
// import { cookies } from 'next/headers';
import { jwtVerify } from "jose";

// Define the name of your role claim within the JWT. Adjust if necessary.
const ROLE_CLAIM = "user_role";

// Define your secret key. It should be the same one used by your Django backend.
// Use environment variables for production!
console.log("JWT_SECRET_KEY from .env:", process.env.JWT_SECRET_KEY);
const jwtSecretKey = process.env.JWT_SECRET_KEY;
const simpleKey = process.env.SIMPLE_SECRET_KEY;

const secret = new TextEncoder().encode(simpleKey);

// Define your dashboard routes
const DASHBOARD_ROUTES = {
  member: "/dashboard/member",
  public: "/dashboard/public",
};

// Define public routes that do not require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/"];

// Type guard to check if a role is a valid key of DASHBOARD_ROUTES
function isDashboardRouteKey(
  role: string
): role is keyof typeof DASHBOARD_ROUTES {
  return role in DASHBOARD_ROUTES;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;

  // Case 1: Initial load for an unauthenticated user
  if (!accessToken) {
    if (!PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Allow access to public pages
    return NextResponse.next();
  }

  // Case 2: User is authenticated, so handle dashboard routing
  try {
    //  const { payload } = await jwtVerify(accessToken, SECRET_KEY);
    const { payload } = await jwtVerify(accessToken, secret);
    const userRole = payload[ROLE_CLAIM] as string;

    if (!isDashboardRouteKey(userRole)) {
      // Handle unrecognized role, e.g., redirect to a default page or login
      return NextResponse.redirect(new URL("/", request.url));
    }

    const userDashboardPath = DASHBOARD_ROUTES[userRole];

    // Check if the user is on a login/signup page and redirect to their dashboard
    if (PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL(userDashboardPath, request.url));
      //  return NextResponse.redirect(new URL(`/auth-redirect?to=${userDashboardPath}`, request.url));
    }

    /*
      // PREVIOUS LOGIC: Redirect to the correct dashboard based on role
      if (pathname.startsWith('/dashboard') && !pathname.startsWith(userDashboardPath)) {
        return NextResponse.redirect(new URL(userDashboardPath, request.url));
      }
      */

    // ✅ NEW LOGIC: Only protect role-specific dashboard homes

    // ✅ TYPE-SAFE: Define all role-specific dashboard homes
    const allRoleDashboards: string[] = Object.values(DASHBOARD_ROUTES);
    // 1. Redirect /dashboard root to role-based home
    if (pathname === "/dashboard") {
      return NextResponse.redirect(new URL(userDashboardPath, request.url));
    }

    // 2. Block access to wrong role's dashboard home

    if (allRoleDashboards.includes(pathname)) {
      // User is trying to access a role-specific home
      if (pathname !== userDashboardPath) {
        // It's not THEIR home - redirect to their correct home
        return NextResponse.redirect(new URL(userDashboardPath, request.url));
      }
    }

    // 3. All other /dashboard/* sub-routes (leaderboard, clubs, etc.) pass through ✅
  } catch (error) {
    console.error("Authentication error:", error);

    // If the token is invalid or expired, clear cookies and redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    return response;
  }

  // Allow the request to proceed if no redirection is needed
  return NextResponse.next();
}

// Specify which paths the middleware should run on
export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard/:path*"],
};
