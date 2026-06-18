import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function Footer() {
  const t = await getTranslations('footer')

  return (
    <footer className="bg-gray-800 text-gray-400 text-sm mt-8">
      <div className="max-w-screen-xl mx-auto px-4 py-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-4">
          <Link href="/terms" className="hover:text-white">{t('terms')}</Link>
          <Link href="/privacy" className="hover:text-white">{t('privacy')}</Link>
          <Link href="/contact" className="hover:text-white">{t('contact')}</Link>
          <Link href="/guide" className="hover:text-white">{t('guide')}</Link>
        </div>
        <img
          src="/images/ブランドロゴ/ブランドロゴ300×80.png"
          alt="RMTsite"
          width={150}
          height={40}
          className="opacity-60"
        />
        <p className="text-xs text-gray-500">© 2026 RMTsite All Rights Reserved.</p>
      </div>
    </footer>
  )
}
