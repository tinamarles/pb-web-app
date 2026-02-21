// app/api/leagues/[leagueId]/eligible-members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { getEligibleMembers } from "@/lib/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  
  try {
    // ✅ Extract requireAuth from query
    const searchParams = request.nextUrl.searchParams;
    const requireAuth = searchParams.get('requireAuth') !== 'false'; // Default: true
    
    // ✅ Only check token if auth required
    if (requireAuth) {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('access_token')?.value;

      if (!accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // ✅ STEP 2: AWAIT params (Next.js 15+ requirement)
    const { leagueId } = await params;
    
    // ✅ STEP 3: Call server action (token already verified!)
    const data = await getEligibleMembers(parseInt(leagueId), requireAuth);

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ API route error: Failed to fetch eligible members:", error);
    return NextResponse.json(
      { error: "Failed to fetch eligible members" },
      { status: 500 }
    );
  }
}
