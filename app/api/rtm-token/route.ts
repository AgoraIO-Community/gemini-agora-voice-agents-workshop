import { NextResponse } from 'next/server';
import { createTokenResponse } from '@/src/rtm-token.js';

// Deck signaling: mints short-lived RTM tokens for the host and audience views.
export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }
  const result = createTokenResponse(body as Parameters<typeof createTokenResponse>[0]);
  return NextResponse.json(result.body, { status: result.status, headers: { 'cache-control': 'no-store' } });
}
