// frontend/lib/actions.ts
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

/**
 * Helper function to get authentication headers with JWT token
 * @returns Headers object with Authorization and Content-Type
 * @throws Error if no access token is found
 */
async function getAuthHeaders() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  
  if (!accessToken) {
    throw new Error('No access token found - user not authenticated');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
}

/**
 * Generic GET request to Django API
 * @param endpoint - Django API endpoint (without /api/ prefix)
 * @returns Promise with typed response data
 * @example await get<Club[]>('clubs')
 */
export async function get<T>(endpoint: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_DJANGO_API_URL is not defined');
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}/`, {
    cache: 'no-store',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to fetch data from endpoint: /${endpoint}. ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

/**
 * Generic POST request to Django API
 * @param endpoint - Django API endpoint (without /api/ prefix)
 * @param data - Request body data
 * @returns Promise with typed response data
 * @example await post<Club>('clubs', { name: 'New Club' })
 */
export async function post<T>(endpoint: string, data: object): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_DJANGO_API_URL is not defined');
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
}

/**
 * Generic PATCH request to Django API
 * @param endpoint - Django API endpoint (without /api/ prefix)
 * @param id - Resource ID
 * @param data - Partial update data
 * @returns Promise with typed response data
 * @example await patch<Club>('clubs', 123, { name: 'Updated Name' })
 */
export async function patch<T>(endpoint: string, id: number, data: object): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_DJANGO_API_URL is not defined');
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}/${id}/`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
}

/**
 * Generic DELETE request to Django API
 * @param endpoint - Django API endpoint (without /api/ prefix)
 * @param id - Resource ID
 * @returns Promise with HTTP status code
 * @example await del('clubs', 123)
 */
export async function del(endpoint: string, id: number): Promise<number> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_DJANGO_API_URL is not defined');
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}/${id}/`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to delete record from endpoint: /${endpoint}/${id}. ${JSON.stringify(errorData)}`);
  }

  return response.status;
}

/**
 * Check if Django backend is reachable
 * @returns Promise<boolean> - true if backend is healthy
 */
export async function checkBackendHealth(): Promise<boolean> {
  if (!API_BASE_URL) {
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/`, { 
      signal: AbortSignal.timeout(5000) 
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}