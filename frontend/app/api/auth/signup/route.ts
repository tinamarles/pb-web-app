import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignUpFormValues, JWTResponse } from "@/app/lib/definitions";

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

export async function POST(req: Request) {
  try {
    const { username, email, password }: SignUpFormValues = await req.json();
    // 1. Call your Django API to get the JWT token
    const djangoResponse = await fetch(`${API_BASE_URL}/api/profile/registration/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!djangoResponse.ok) {
      // Handle failed login attempts
      const errorData = await djangoResponse.json();
      // return NextResponse.json({ error: errorData.detail }, { status: 401 });
      return NextResponse.json(errorData, {status: djangoResponse.status});
    }

    const { access, refresh }: JWTResponse = await djangoResponse.json();

    // 2. Get the cookie store asynchronously
    const cookieStore = await cookies();

    // 3. Set the JWT token in a secure, HttpOnly cookie
    cookieStore.set("access_token", access, {
      httpOnly: true, // Only accessible by the web server
      secure: process.env.NODE_ENV === "production", // Only sent over HTTPS
      maxAge: 60 * 60, // e.g., 1 hour
      path: "/",
      sameSite: "strict", // Protects against some CSRF attacks
    });

    // 4. Handle the refresh token similarly if your backend supports it
    cookieStore.set("refresh_token", refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // e.g., 7 days
      path: "/",
      sameSite: "strict",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign Up error:', error);
    return NextResponse.json({ error: "Sign Up failed" }, { status: 500 });
  }
}
