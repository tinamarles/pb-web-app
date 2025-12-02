import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LoginFormValues, JWTResponse } from "@/lib/definitions";

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

export async function POST(req: Request) {
  try {
    const { identifier, password }: LoginFormValues = await req.json();
    console.log("🔵 Login request received");
    console.log("🔵 Identifier:", identifier);
    console.log("🔵 Password length:", password?.length);
    
    const djangoUrl = `${API_BASE_URL}/api/token/`;
    console.log("🔵 Calling Django at:", djangoUrl);

    // 1. Call your Django API to get the JWT token
    const djangoResponse = await fetch(`${API_BASE_URL}/api/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    // LOGGING OF DJANGO RESPONSE 
    console.log("🔵 Django response status:", djangoResponse.status);
    console.log("🔵 Django response headers:", Object.fromEntries(djangoResponse.headers.entries()));

    if (!djangoResponse.ok) {
      // Handle failed login attempts
      const errorData = await djangoResponse.json();

      // 🎯 LOG EVERYTHING DJANGO SENDS!
      console.error("❌ Django response status:", djangoResponse.status);
      console.error("❌ Django error data:", errorData);
      console.error("❌ Full error object:", JSON.stringify(errorData, null, 2));

      // return NextResponse.json({ error: errorData.detail }, { status: 401 });
      return NextResponse.json(
        { error:errorData.detail || 
          errorData.error || 
          JSON.stringify(errorData) ||
          'Failed to login'}, 
          { status: djangoResponse.status }
      );
    }

    const { access, refresh }: JWTResponse = await djangoResponse.json();

    // LOG THE TOKENS
    console.log("✅ Got tokens from Django");
    console.log("🔵 Access token length:", access?.length);
    console.log("🔵 Refresh token length:", refresh?.length);

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

    console.log("✅ Cookies set successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🔴 Caught exception - Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
