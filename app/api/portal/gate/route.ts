import { NextRequest, NextResponse } from 'next/server'

const PORTAL_PASSWORD = process.env.PORTAL_PASSWORD ?? 'LIFAITOMAKEMONEY'
const COOKIE_NAME = '__prtl_k'
const COOKIE_VALUE = 'lifai-ops-granted'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password?: string }

  if (password !== PORTAL_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_NAME)
  return res
}
