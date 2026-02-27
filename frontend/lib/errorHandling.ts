// lib/errorHandling.ts

import { redirect } from 'next/navigation';
import type { ApiError } from './apiErrors';
import { NextResponse } from "next/server";
import { ValidationError } from './validationErrors';

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

/**
 * Handle API errors in ROUTE HANDLERS by returning JSON response
 * 
 * ✅ USE IN: route.ts (API Route Handlers)
 * ❌ DON'T USE IN: page.tsx (use handleApiError instead!)
 * 
 * WHY: route.ts cannot use redirect() - it must return NextResponse!
 * PATTERN: Mirrors handleApiError() but returns JSON instead of redirect
 */
export function handleApiErrorInRoute(
  error: ApiError | ValidationError
): NextResponse {
  // Extract common properties
  const message = error.message;
  const status = error.status;
  const detail = 'detail' in error ? error.detail : undefined;
  const endpoint = 'endpoint' in error ? error.endpoint : undefined;

  // Build response object
  const response: any = {
    error: message,
    status,
  };

  if (detail) {
    response.detail = detail;
  }

  if (endpoint) {
    response.endpoint = endpoint;
  }

  return NextResponse.json(response, { status });
}