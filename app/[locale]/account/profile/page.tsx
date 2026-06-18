'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LifaiSellHistory from '@/components/LifaiSellHistory'

export default function ProfilePage() {
  const t = useTranslations('account.profile')
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="mx-auto max-w-screen-md px-4 py-10 text-sm text-gray-500">{t('loading')}</div>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-10">
        <p className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t('signinRequired')}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0b1929]">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        <Link href="/account/settings" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          {t('editSettings')}
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">{t('displayName')}</p>
          <p className="text-lg font-semibold text-gray-900">{user.display_name}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">{t('email')}</p>
          <p className="text-lg font-semibold text-gray-900">{user.email}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">{t('fullName')}</p>
          <p className="text-lg font-semibold text-gray-900">{[user.first_name, user.last_name].filter(Boolean).join(' ') || t('notSet')}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">{t('country')}</p>
          <p className="text-lg font-semibold text-gray-900">{user.country || t('notSet')}</p>
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
        <p className="font-medium text-gray-700">{t('accountStatus')}</p>
        <p className="mt-1">{t('emailVerified')}: {user.email_verified ? t('verified') : t('notVerified')}</p>
        <p>{t('lastLogin')}: {user.last_login || t('noLoginHistory')}</p>
        <p className="mt-2 font-mono text-xs">{t('walletAddress')}: {user.wallet_address}</p>
      </div>
      <LifaiSellHistory />
    </div>
  )
}
