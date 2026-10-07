import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/changelog';

export const dynamic = 'force-dynamic';

/** The deployment currently being served; open tabs compare it with their own build. */
export function GET() {
  return NextResponse.json(
    { build: process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev', version: APP_VERSION },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
