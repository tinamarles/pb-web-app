'use server';

import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

export async function saveAvatar(url: string) {
    try {
      // Get the access token from cookies (same pattern as user/route.ts)
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('access_token')?.value;

      if (!accessToken) {
        return {
          success: false,
          error: "Not authenticated",
        };
      }

      if (!API_BASE_URL) {
        return {
          success: false,
          error: "API_BASE_URL is not configured",
        };
      }

      // Call Django profile update endpoint
      const response = await fetch(`${API_BASE_URL}/api/profile/update/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          profile_picture_url: url, // Django field name (snake_case)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update avatar:', errorData);
        return {
          success: false,
          error: errorData.detail || "Failed to update avatar",
        };
      }

      const userData = await response.json();
      console.log('Avatar updated successfully:', userData);

      return {
        success: true,
        data: userData,
      }
    } catch (error) {
      console.error('Error saving avatar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
}