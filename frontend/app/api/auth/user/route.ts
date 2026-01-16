import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { User } from "@/lib/definitions";

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

export async function GET(_req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      // If no token is found, return an unauthorized response
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Call Django API to get the user data
    const djangoResponse = await fetch(`${API_BASE_URL}/api/auth/user/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // 2. Add the JWT token to the Authorization header
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!djangoResponse.ok) {
      // Handle Django API errors
      const errorData = await djangoResponse.json();
      return NextResponse.json(
        { error: errorData.detail },
        { status: djangoResponse.status }
      );
    }

  // 3. Parse the Django response
  const userData: User = await djangoResponse.json();

  // 4. Fetch notifications
  const feedResponse = await fetch(`${API_BASE_URL}/api/feed/`, {
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!feedResponse.ok) {
    throw new Error('Failed to fetch notifications');
  }

  const feedData = await feedResponse.json();

  // 5. Return combined response (user data + notifications)

  return NextResponse.json({
    ...userData,  // spread user data
    notifications: feedData.items,
    unreadCount: feedData.badge_count,
  });
  } catch (error) {
    console.error("Error getting User data:", error);
    return NextResponse.json(
      { error: "Error getting User data" },
      { status: 500 }
    );
  }
}
