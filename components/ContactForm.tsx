'use client'

import { FormEvent, useState } from 'react'
import { useTranslations } from 'next-intl'

export default function ContactForm() {
  const t = useTranslations('contact')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [referenceId, setReferenceId] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 900))

    const id = `CT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    setReferenceId(id)
    setSubmitting(false)
    setSubmitted(true)
  }

  function handleReset() {
    setSubmitted(false)
    setReferenceId('')
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {t('success.eyebrow')}
        </p>
        <h2 className="mt-2 text-2xl font-bold">{t('success.title')}</h2>
        <p className="mt-3 text-sm leading-7 text-emerald-800">{t('success.body')}</p>
        <div className="mt-5 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm">
          <span className="font-semibold">{t('success.referenceLabel')}</span> {referenceId}
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#0b1929] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0d2038]"
        >
          {t('success.another')}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-gray-700">
            {t('fields.name')}
          </label>
          <input
            id="contact-name"
            name="name"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-gray-700">
            {t('fields.email')}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="contact-category" className="mb-1 block text-sm font-medium text-gray-700">
            {t('fields.category')}
          </label>
          <select
            id="contact-category"
            name="category"
            defaultValue=""
            required
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400"
          >
            <option value="" disabled>
              {t('fields.categoryPlaceholder')}
            </option>
            <option value="order">{t('categories.order')}</option>
            <option value="seller">{t('categories.seller')}</option>
            <option value="account">{t('categories.account')}</option>
            <option value="other">{t('categories.other')}</option>
          </select>
        </div>
        <div>
          <label htmlFor="contact-order-id" className="mb-1 block text-sm font-medium text-gray-700">
            {t('fields.orderId')}
          </label>
          <input
            id="contact-order-id"
            name="orderId"
            placeholder={t('fields.orderIdPlaceholder')}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-1 block text-sm font-medium text-gray-700">
          {t('fields.subject')}
        </label>
        <input
          id="contact-subject"
          name="subject"
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-gray-700">
          {t('fields.message')}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={7}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        {t('note')}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-[#0b1929] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0d2038] disabled:opacity-60"
      >
        {submitting ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
