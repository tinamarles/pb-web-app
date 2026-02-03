import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { getSessionParticipants } from "@/lib/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
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
    const { sessionId } = await params;
    
    // ✅ STEP 3: Call server action (token already verified!)
    const data = await getSessionParticipants(sessionId, requireAuth);

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ API route error: Failed to fetch session participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch Session Participants" },
      { status: 500 }
    );
  }
}
