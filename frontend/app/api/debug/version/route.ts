import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    nextVersion: process.env.NEXT_RUNTIME || 'unknown',
    nodeVersion: process.version,
    env: process.env.NODE_ENV,
  });
}