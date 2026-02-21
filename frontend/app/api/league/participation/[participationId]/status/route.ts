// app/api/league/participation/[id]/status/route.ts
/**
 * API Route: Update League Participation Status
 * 
 * Pattern: Client Component → clientActions.ts → THIS route → Django
 * 
 * PATCH /api/league/participation/[id]/status
 * 
 * Request Body:
 * {
 *   "status": 1  // Integer constant from LeagueParticipationStatus
 * }
 * 
 * Response:
 * {
 *   "participants": AdminLeagueParticipant[],
 *   "attendanceChanges": [{
 *     "participation_id": 71,
 *     "attendanceCreated": 21,
 *     "attendanceDeleted": 0,
 *     "attendanceUpdated": 0,
 *     "message": "Created 21 attendance records"
 *   }]
 * }
 * 
 * Django Endpoint: PATCH /api/leagues/participation/{id}/status/
 * Serializer: ParticipantStatusUpdateSerializer
 * Permissions: IsLeagueAdmin
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ participationId: string }> }
) {
  try {
    // ✅ Await params (Next.js 15 requirement)
    const { participationId } = await params;
    
    // ✅ Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No access token" },
        { status: 401 }
      );
    }

    // ✅ Parse request body
    const body = await request.json();
    const { status } = body;

    // ✅ Validate status is provided
    if (status === undefined || status === null) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // ✅ Validate status is a number
    if (typeof status !== "number") {
      return NextResponse.json(
        { error: "Status must be a number" },
        { status: 400 }
      );
    }

    // ✅ Forward request to Django
    const response = await fetch(
      `${API_BASE_URL}/api/leagues/participation/${participationId}/status/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    // ✅ Handle Django errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.detail || errorData.message || "Failed to update participation status",
          ...errorData 
        },
        { status: response.status }
      );
    }

    // ✅ Return Django response
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error in /api/league/participation/[participationId]/status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
