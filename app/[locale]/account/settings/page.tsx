'use client'

import { FormEvent, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'

export default function SettingsPage() {
  const t = useTranslations('account.settings')
  const { user, loading } = useAuth()
  const [saved, setSaved] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(true)
  }

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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-[#0b1929]">{t('title')}</h1>
        <p className="mb-6 text-sm text-gray-500">{t('subtitle')}</p>
        {saved ? <p className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{t('saved')}</p> : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('displayName')}</label>
              <input defaultValue={user.display_name} name="display_name" className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('country')}</label>
              <input defaultValue={user.country} name="country" className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('phone')}</label>
            <input defaultValue={user.phone ?? ''} name="phone" className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('email')}</label>
            <input value={user.email} disabled className="w-full cursor-not-allowed rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400" />
            <p className="mt-1 text-xs text-gray-400">{t('emailNote')}</p>
          </div>
          <button type="submit" className="rounded-lg bg-[#0b1929] px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0d2038]">
            {t('save')}
          </button>
        </form>
      </div>
    </div>
  )
}
