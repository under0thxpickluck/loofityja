import { getTranslations } from 'next-intl/server'
import ContactForm from '@/components/ContactForm'

export default async function ContactPage() {
  const t = await getTranslations('contact')

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-gray-200 bg-[#0b1929] p-6 text-white shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">{t('eyebrow')}</p>
          <h1 className="mt-3 text-3xl font-bold">{t('title')}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">{t('subtitle')}</p>

          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">{t('cards.responseTitle')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t('cards.responseBody')}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">{t('cards.includeTitle')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t('cards.includeBody')}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">{t('cards.scopeTitle')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t('cards.scopeBody')}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-2 text-2xl font-bold text-[#0b1929]">{t('formTitle')}</h2>
          <p className="mb-6 text-sm text-gray-500">{t('formSubtitle')}</p>
          <ContactForm />
        </section>
      </div>
    </div>
  )
}
