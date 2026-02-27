import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { User } from "@/lib/definitions";
import { get } from '@/lib/actions';
import { DjangoFeed, DjangoUser } from '@/lib/apiResponseTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

export async function GET(_req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      // If no token is found, return an unauthorized response
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get user data (using actions.ts)
    const userData = await get<DjangoUser>('auth/user');

    // 2. Get feed (using actions.ts)
    const feedData = await get<DjangoFeed>('notifications');

    // 3. Return combined response
    return NextResponse.json({
      ...userData,
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
