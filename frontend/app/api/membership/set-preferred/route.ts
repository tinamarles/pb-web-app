// app/api/membership/set-preferred/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

export async function PATCH(request: Request) {
  try {
    // ✅ CHECK AUTH FIRST (like /api/auth/user does!)
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      // ✅ Return 401 - Middleware will handle redirect!
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { membershipId } = body;

    // ✅ Call Django directly (skip actions.ts in API routes!)
    const response = await fetch(
      `${API_BASE_URL}/api/clubs/membership/${membershipId}/set-preferred/`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ is_preferred_club: true }),
      }
    );

    if (!response.ok) {
      // Handle Django API errors
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail },
        { status: response.status }
      );
    }

    const allMemberships = await response.json();
    return NextResponse.json(allMemberships);

  } catch (error) {
    console.error('Set preferred membership error:', error);
    return NextResponse.json(
      { error: 'Failed to set preferred membership' },
      { status: 500 }
    );
  }
}