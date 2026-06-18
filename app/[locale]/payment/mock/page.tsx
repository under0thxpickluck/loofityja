'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function MockPaymentPage() {
  const t = useTranslations('paymentMock')
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 text-4xl">Test</div>
        <h1 className="mb-2 text-xl font-bold text-[#0b1929]">{t('title')}</h1>
        <p className="mb-2 text-sm text-gray-600">{t('line1')}</p>
        <p className="mb-2 text-sm text-gray-500">{t('line2')}</p>
        <p className="mb-6 text-sm text-gray-400">{t('line3')}</p>

        <div className="mb-6 space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left text-xs text-gray-500">
          <p><span className="font-medium">{t('tokenLabel')}:</span> {token || '-'}</p>
          <p><span className="font-medium">{t('statusLabel')}:</span> {t('statusValue')}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/" className="block rounded-lg bg-[#0b1929] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0d2038]">
            {t('home')}
          </Link>
          <Link href="/account/profile" className="block rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            {t('profile')}
          </Link>
        </div>
      </div>
    </div>
  )
}
