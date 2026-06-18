'use client'

import { FormEvent, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { gasClient } from '@/lib/gas-client'

export default function VerifyEmailPage() {
  const router = useRouter()
  const t = useTranslations('verifyEmail')
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const code = String(formData.get('code') ?? '')
    const response = await gasClient.verifyEmail(email, code)
    setSubmitting(false)

    if (response.ok) {
      router.push(`/login?verified=1&email=${encodeURIComponent(email)}`)
      return
    }

    setError(response.message)
  }

  async function handleResend() {
    setError('')
    setMessage('')
    setResending(true)
    const response = await gasClient.resendVerifyCode(email)
    setResending(false)

    if (response.ok) {
      setMessage(t('resendSuccess'))
      return
    }

    setError(response.message)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-[#0b1929]">{t('title')}</h1>
        <p className="mb-6 text-sm text-gray-500">{t('subtitle', { email: email || t('fallbackInbox') })}</p>
        {error ? <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        <form onSubmit={handleVerify} className="space-y-4">
          <input name="code" inputMode="numeric" maxLength={6} placeholder={t('code')} required className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#0b1929] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0d2038] disabled:opacity-60">
            {submitting ? t('verifying') : t('submit')}
          </button>
        </form>
        <button type="button" onClick={handleResend} disabled={resending || !email} className="mt-3 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60">
          {resending ? t('sending') : t('resend')}
        </button>
        <p className="mt-4 text-center text-sm text-gray-500">
          <Link href="/login" className="text-sky-700 hover:underline">{t('back')}</Link>
        </p>
      </div>
    </div>
  )
}
