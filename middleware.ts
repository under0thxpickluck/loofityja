import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['en', 'ja', 'zh']
const defaultLocale = 'en'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  )
  if (!hasLocale) {
    const url = req.nextUrl.clone()
    url.pathname = `/${defaultLocale}${pathname}`
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
