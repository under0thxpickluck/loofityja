import { NextResponse } from 'next/server'
import { gasClient } from '@/lib/gas-client'

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const session_token = String(body?.session_token ?? '').trim()
  if (!session_token) {
    return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 })
  }

  const result = await gasClient.getLifaiSellRequests(session_token)
  return NextResponse.json(result)
}
