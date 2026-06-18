'use client'

import { FormEvent, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { gasClient } from '@/lib/gas-client'

export default function SignupPage() {
  const router = useRouter()
  const t = useTranslations('signup')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      display_name: String(formData.get('display_name') ?? ''),
      first_name: String(formData.get('first_name') ?? ''),
      last_name: String(formData.get('last_name') ?? ''),
      country: String(formData.get('country') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      birth_date: String(formData.get('birth_date') ?? ''),
      marketing_opt_in: formData.get('marketing_opt_in') === 'on',
    }

    try {
      const response = await gasClient.signup(payload)
      if (response.ok) {
        router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`)
        return
      }
      setError(response.message)
    } catch {
      setError('予期しないエラーが発生しました。再度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="mb-2 text-2xl font-bold text-[#0b1929]">{t('title')}</h1>
        <p className="mb-6 text-sm text-gray-500">{t('subtitle')}</p>
        {error ? <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input name="first_name" placeholder={t('firstName')} required className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
            <input name="last_name" placeholder={t('lastName')} required className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          </div>
          <input name="display_name" placeholder={t('displayName')} required className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          <input name="email" type="email" placeholder={t('email')} required className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          <input name="password" type="password" placeholder={t('password')} required className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="country" placeholder={t('country')} required className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
            <input name="phone" placeholder={t('phone')} className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          </div>
          <input name="birth_date" type="date" className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input name="marketing_opt_in" type="checkbox" className="mt-0.5" />
            <span>{t('marketing')}</span>
          </label>
          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#0b1929] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0d2038] disabled:opacity-60">
            {submitting ? t('submitting') : t('submit')}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-500">
          {t('haveAccount')} <Link href="/login" className="font-medium text-sky-700 hover:underline">{t('signin')}</Link>
        </p>
      </div>
    </div>
  )
}
