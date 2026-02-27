// templates/Routes.ts
/**
 * Use this for api/.../route.ts files
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
// import the server action function from actions.ts
import { updateParticipationStatus } from "@/lib/actions";

// Error Handling Imports
import { isApiError } from "@/lib/apiErrors";
import { isValidationError } from "@/lib/validationErrors";
import { handleApiErrorInRoute } from "@/lib/errorHandling";
import { createValidationError } from "@/lib/validationErrors";

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ participationId: string }> } // any parameters that are inside the route with []
) {
  try {
    // ✅ Await params (Next.js 15 requirement)
    const { participationId } = await params;
    
    // ✅ Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      throw createValidationError("Authentication required", 401);
    }

    // ✅ Parse request body
    const body = await request.json();
    const { field1, field2 } = body;

    // ✅ Validate those fields if necessary 
    if (field1 === undefined || field1 === null) {
      throw createValidationError("field1 is required", 400);
    }

    // ✅ Validate if field has correct type 
    if (typeof field1 !== "number") {
      throw createValidationError("field1 must be numeric", 400);
    }

    // Call server action
    const data = await updateParticipationStatus(parseInt(participationId), field1)

    // ✅ Return Django response
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("❌ API route error: Failed to update participation status", error);
    
    // ✅ REUSE ApiError pattern!
    if (isApiError(error) || isValidationError(error)) {
      return handleApiErrorInRoute(error);
    }
    
    // Fallback for unknown errors
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
    
  }
}
