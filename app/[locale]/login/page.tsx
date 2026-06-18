'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('login')
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const infoMessage = useMemo(() => {
    if (searchParams.get('verified') === '1') return t('verified')
    return ''
  }, [searchParams, t])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')
    const response = await login(email, password)
    setSubmitting(false)

    if (response.ok) {
      const redirect = searchParams.get('redirect') || '/account/profile'
      router.push(redirect)
      return
    }

    if (response.code === 'VERIFY_REQUIRED') {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
      return
    }

    setError(response.message)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-[#0b1929]">{t('title')}</h1>
        <p className="mb-6 text-sm text-gray-500">{t('subtitle')}</p>
        {infoMessage ? <p className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{infoMessage}</p> : null}
        {error ? <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="email" type="email" defaultValue={searchParams.get('email') ?? ''} placeholder={t('email')} required className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          <input name="password" type="password" placeholder={t('password')} required className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#0b1929] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0d2038] disabled:opacity-60">
            {submitting ? t('submitting') : t('submit')}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-500">
          {t('needAccount')} <Link href="/signup" className="font-medium text-sky-700 hover:underline">{t('createOne')}</Link>
        </p>
      </div>
    </div>
  )
}
