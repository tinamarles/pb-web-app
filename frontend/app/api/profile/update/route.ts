// app/api/profile/update/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { camelToSnake } from "@/app/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

export async function PATCH(req: Request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Unauthorized'},
                { status: 401 }
            );
        }

        // ✅ Get WHATEVER fields the client sends (could be 1 field or all fields)  
        const updateData = await req.json();

        // ✅ Optional: Validate that at least SOMETHING is being updated  
        if (Object.keys(updateData).length === 0) {  
            return NextResponse.json(  
                { error: "No fields provided for update" },  
                { status: 400 }  
            );  
        }
        // Convert camelCase to snake_case for Django
        const djangoData = camelToSnake(updateData);

        console.log('djangoData:', djangoData);

        // ✅ Forward the ENTIRE object to Django - it handles partial updates
        const djangoResponse = await fetch (
            `${API_BASE_URL}/api/profile/update/`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(djangoData),
            }
        );
        /*
        if (!djangoResponse.ok) {
            const errorData = await djangoResponse.json();
            return NextResponse.json(
                { error: errorData.detail || 'Failed to update profile' },
                { status: djangoResponse.status }
            );
        }
        */

        if (!djangoResponse.ok) {
            const errorData = await djangoResponse.json();
            
            // 🎯 LOG EVERYTHING DJANGO SENDS!
            console.error("❌ Django response status:", djangoResponse.status);
            console.error("❌ Django error data:", errorData);
            console.error("❌ Full error object:", JSON.stringify(errorData, null, 2));
            
            return NextResponse.json(
                { error: errorData.detail || errorData.error || JSON.stringify(errorData) || 'Failed to update profile' },
                { status: djangoResponse.status }
            );
        }
        const userData = await djangoResponse.json();
        console.log('Profile updated successfully:', userData);

        return NextResponse.json(userData);

    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: 'Error updating profile'},
            { status: 500 }
        );
    }
}