// lib/errorHandling.ts

import { redirect } from 'next/navigation';
import type { ApiError } from './apiErrors';

/**
 * Handle API errors in server components by redirecting with error params
 * that will be picked up by ErrorToastHandler client component
 * 
 * @param error - ApiError object
 * @param fallbackUrl - URL to redirect to (default: /dashboard/member)
 * @throws Always redirects (never returns)
 */
export function handleApiError(
  error: ApiError, 
  fallbackUrl: string = '/dashboard/member'
): never {
  const message = encodeURIComponent(error.detail);
  
  switch (error.status) {
    case 401:
      redirect('/login?error=authentication_required');
      
    case 403:
      redirect(`${fallbackUrl}?error=not_authorized&message=${message}`);
      
    case 404:
      redirect(`${fallbackUrl}?error=not_found&message=${message}`);
      
    default:
      redirect(`${fallbackUrl}?error=unknown&message=${message}`);
  }
}
