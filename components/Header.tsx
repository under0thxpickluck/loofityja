// components/Header.tsx
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import UserMenu from '@/components/UserMenu'

export default async function Header() {
  const t = await getTranslations('header')

  return (
    <header>
      <div className="bg-[#0b1929] text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center gap-4">
          <Link href="/" className="flex items-center whitespace-nowrap">
            <img
              src="/images/ブランドロゴ/ブランドロゴ300×80.png"
              alt="RMTsite"
              width={150}
              height={40}
            />
          </Link>
          <form action="/search" method="get" className="flex-1">
            <input
              type="text"
              name="q"
              placeholder={t('search')}
              className="w-full px-3 py-1.5 text-sm text-gray-800 rounded border-0 outline-none"
              aria-label={t('search')}
            />
          </form>
          <div className="flex items-center gap-3 text-sm whitespace-nowrap">
            <UserMenu />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
      <nav className="bg-[#0d2038] border-b border-[#1a3a5c]">
        <div className="max-w-screen-xl mx-auto px-4 py-1.5 flex gap-6 text-sm text-sky-300">
          <Link href="/category?type=pc" className="hover:underline">{t('nav.pc')}</Link>
          <Link href="/category?type=mobile" className="hover:underline">{t('nav.mobile')}</Link>
          <Link href="/category?type=other" className="hover:underline">{t('nav.other')}</Link>
          <Link href="/category" className="hover:underline">{t('nav.all')}</Link>
        </div>
      </nav>
    </header>
  )
}
