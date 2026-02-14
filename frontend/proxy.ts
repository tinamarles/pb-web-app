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
  member: "/dashboard/overview",
  public: "/feed/discover",
};

// Define public routes that do not require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/"];

// Define the post-signup redirect page
const PROFILE_SETUP_ROUTE = "/profile/setup";

// Type guard to check if a role is a valid key of DASHBOARD_ROUTES
function isDashboardRouteKey(
  role: string
): role is keyof typeof DASHBOARD_ROUTES {
  return role in DASHBOARD_ROUTES;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;

  // Case 1: Initial load for an unauthenticated user
  if (!accessToken) {
    if (!PUBLIC_ROUTES.includes(pathname) && pathname !== PROFILE_SETUP_ROUTE) {
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

    // Redirect authenticated users trying to access public pages
    if (PUBLIC_ROUTES.includes(pathname)) {
      // New User Redirection Logic
      // If the user just signed up (pathname === '/signup'), send them to the profile-setup page
      if (pathname === "/signup") {
        return NextResponse.redirect(new URL(PROFILE_SETUP_ROUTE, request.url));
      }
      // For all other public pages, redirect them to their correct dashboard.
      return NextResponse.redirect(new URL(userDashboardPath, request.url));
      //  return NextResponse.redirect(new URL(`/auth-redirect?to=${userDashboardPath}`, request.url));
    }

    // ✅ ROUTE PROTECTION: Feed vs Dashboard based on user role

    // 1. Protect feed routes (public users only)
    if (pathname.startsWith("/feed")) {
      if (userRole !== "public") {
        console.log(
          "🔄 Member user trying to access feed, redirecting to dashboard"
        );
        return NextResponse.redirect(
          new URL("/dashboard/overview", request.url)
        );
      }
    }

    // 2. Protect dashboard routes (member users only)
    if (pathname.startsWith("/dashboard")) {
      if (userRole !== "member") {
        console.log(
          "🔄 Public user trying to access dashboard, redirecting to feed"
        );
        return NextResponse.redirect(new URL("/feed/discover", request.url));
      }
    }
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
  matcher: [
    "/",
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/feed/:path*",
    "/profile/:path*",
    "/profile/setup",
    "/admin/:path*",
  ],
};
