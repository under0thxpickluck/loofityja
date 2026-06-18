'use client'

import { useCallback } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

const LOCALES = [
  { code: 'en', label: 'EN' },
  { code: 'ja', label: 'JA' },
  { code: 'zh', label: 'ZH' },
] as const

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = useCallback((newLocale: (typeof LOCALES)[number]['code']) => {
    router.replace(pathname, { locale: newLocale })
  }, [router, pathname])

  return (
    <div className="flex gap-1 text-xs">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => switchLocale(code)}
          aria-label={`Switch language to ${code}`}
          aria-pressed={code === locale}
          className={
            code === locale
              ? 'bg-white text-sky-600 px-2 py-1 rounded font-bold'
              : 'text-white/80 hover:text-white px-2 py-1 rounded'
          }
        >
          {label}
        </button>
      ))}
    </div>
  )
}
