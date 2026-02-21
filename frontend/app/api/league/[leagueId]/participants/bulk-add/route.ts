// app/api/leagues/[leagueId]/participants/bulk-add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { addLeagueParticipants } from "@/lib/actions";

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
      return NextResponse.json(
        { error: 'Invalid request: memberIds array required' },
        { status: 400 }
      );
    }

    // ✅ Call server action
    const data = await addLeagueParticipants(parseInt(leagueId), memberIds);

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ API route error: Failed to add league participants:", error);
    return NextResponse.json(
      { error: "Failed to add participants" },
      { status: 500 }
    );
  }
}
