import { NextRequest, NextResponse } from "next/server";
import { getClubEvents } from "@/lib/actions";

/**
 * GET /api/clubs/[clubId]/events
 *
 * Fetch events for a club with optional filters
 *
 * Query params:
 * - type: 'event' | 'league' | 'all' (default: 'all')
 * - status: 'upcoming' | 'past' | 'all' (default: 'all')
 * - page: page number (default: '1')
 * - pageSize: number of items per page (optional)
 *
 * Returns: PaginatedResponse<League> { count, next, previous, results }
 *
 * @example
 * GET /api/clubs/123/events?type=event&status=upcoming
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  // ✅ AWAIT params FIRST!
  const { clubId } = await params;

  try {
    // Extract query params
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status") || "all";
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("pageSize"); // Optional - may be null
    const includeUserParticipation =
      searchParams.get("includeUserParticipation") === "true"; // ← NEW!

    // Call server action (which uses cookies)
    const filters: {
      type?: "league" | "event" | "all";
      status?: "upcoming" | "past" | "all";
      page?: string;
      pageSize?: string;
      includeUserParticipation?: boolean;
    } = {
      type: type as "league" | "event" | "all",
      status: status as "upcoming" | "past" | "all",
      page,
    };

    // Only add pageSize if provided
    if (pageSize) {
      filters.pageSize = pageSize;
    }

    // ← NEW: Add if true
    if (includeUserParticipation) {
      filters.includeUserParticipation = true;
    }

    const data = await getClubEvents(clubId, filters);

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ API route error: Failed to fetch club events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
