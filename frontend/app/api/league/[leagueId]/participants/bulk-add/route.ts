// app/api/leagues/[leagueId]/participants/bulk-add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { addLeagueParticipants } from "@/lib/actions";
import { isApiError } from "@/lib/apiErrors";
import { isValidationError } from "@/lib/validationErrors";
import { handleApiErrorInRoute } from "@/lib/errorHandling";
import { createValidationError } from "@/lib/validationErrors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  
  try {
    // ✅ Check authentication
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ AWAIT params (Next.js 15+ requirement)
    const { leagueId } = await params;
    
    // ✅ Get request body
    const body = await request.json();
    const { memberIds } = body;

    if (!memberIds || !Array.isArray(memberIds)) {
      throw createValidationError("Invalid request: memberIds array required", 400);
    }

    // ✅ Call server action
    const data = await addLeagueParticipants(leagueId, memberIds);

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ API route error: Failed to add league participants:", error);
    // ✅ REUSE ApiError pattern!
    if (isApiError(error) || isValidationError(error)) {
      return handleApiErrorInRoute(error);
    }

    // Fallback for unknown errors
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
