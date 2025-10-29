// frontend/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

// This is a generic function that can fetch any type of data.
export async function get<T>(endpoint: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_DJANGO_API_URL is not defined');
  }

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}/`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data from endpoint: /${endpoint}`);
  }

  return response.json();
}

// Now this function is also generic, returning the type of the created object.
export async function post<T>(endpoint: string, data: object): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_DJANGO_API_URL is not defined');
  }

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
}

// This function is also generic, returning the type of the updated object.
export async function patch<T>(endpoint: string, id: number, data: object): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_DJANGO_API_URL is not defined');
  }

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
}

// This function does not need to be generic as it returns a fixed status code.
export async function del(endpoint: string, id: number): Promise<number> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_DJANGO_API_URL is not defined');
  }

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}/${id}/`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete record from endpoint: /${endpoint}/${id}`);
  }

  return response.status;
}


// This function combines the generic 'del' call with the specific revalidation logic.
export async function deleteMember(id: number) {
  try {
    await del('members', id);
    revalidatePath('/members'); // Revalidate only the /members page
  } catch (error) {
    // You can handle errors here, like logging to a service
    console.error('Failed to delete member:', error);
    // You could also return a specific error message to the UI
    return { message: 'Database Error: Failed to Delete Member.' };
  }
}

// This function combines the generic 'patch' call with the specific revalidation logic.
export async function updateMember(id: number, data: object) {
  try {
    await patch('members', id, data);
    revalidatePath('/members'); // Revalidate only the /members page
  } catch (error) {
    console.error('Failed to update member:', error);
    // You could also return a specific error message to the UI
    return { message: 'Database Error: Failed to Update Member.' };
  }
}

// Function to check if the backend API is reachable
export async function checkBackendHealth(): Promise<boolean> {
  if (!API_BASE_URL) {
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/`, { signal: AbortSignal.timeout(5000) });
    // A 200-299 status code means the API is reachable.
    return response.ok;
  } catch (error) {
    // A TypeError indicates a network issue (server is down or URL is wrong).
    // An AbortError indicates the request timed out.
    console.error('Backend health check failed:', error);
    return false;
  }
}