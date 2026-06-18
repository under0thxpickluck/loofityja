'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function UserMenu() {
  const router = useRouter()
  const t = useTranslations('userMenu')
  const { user, loading, logout } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  async function handleLogout() {
    setSubmitting(true)
    await logout()
    setSubmitting(false)
    router.push('/')
  }

  if (loading) {
    return <div className="text-sm text-sky-100">{t('loading')}</div>
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm whitespace-nowrap">
        <Link href="/login" className="hover:underline">{t('login')}</Link>
        <Link href="/signup" className="hover:underline">{t('signup')}</Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 text-sm whitespace-nowrap">
      <Link href="/account/profile" className="font-medium text-sky-100 hover:text-white">
        {user.display_name}
      </Link>
      <Link href="/account/settings" className="hover:underline">
        {t('settings')}
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        disabled={submitting}
        className="hover:underline disabled:opacity-60"
      >
        {submitting ? t('signingOut') : t('logout')}
      </button>
    </div>
  )
}
