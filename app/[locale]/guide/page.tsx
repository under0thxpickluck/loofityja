import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

type Step = {
  title: string
  body: string
  imageLabel?: string
}

type TrustCard = {
  title: string
  body: string
  icon: 'shield' | 'bolt' | 'star'
}

const howIcons = ['search', 'card', 'package'] as const
const buyerArtwork = [
  '/images/guide/account-setup.svg',
  '/images/guide/browse-listings.svg',
  '/images/guide/secure-checkout.svg',
  '/images/guide/delivery-handoff.svg',
] as const
const sellerArtwork = [
  '/images/guide/account-setup.svg',
  '/images/guide/seller-dashboard.svg',
  '/images/guide/delivery-handoff.svg',
  '/images/guide/payout-summary.svg',
] as const

function Icon({ name }: { name: string }) {
  if (name === 'search') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m21 21-4.3-4.3" />
        <circle cx="11" cy="11" r="7" />
      </svg>
    )
  }
  if (name === 'card') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h4" />
      </svg>
    )
  }
  if (name === 'package') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
      </svg>
    )
  }
  if (name === 'shield') {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3 5 6v5c0 4.2 2.8 8.1 7 10 4.2-1.9 7-5.8 7-10V6l-7-3Z" />
        <path d="m8.8 12.2 2.1 2.1 4.5-4.8" />
      </svg>
    )
  }
  if (name === 'bolt') {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  )
}

function GuideImage({
  src,
  alt,
  priority = false,
}: {
  src: string
  alt: string
  priority?: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)]">
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-sky-50 to-transparent" />
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={1120}
        priority={priority}
        className="h-auto w-full"
      />
    </div>
  )
}

function DetailSteps({
  steps,
  artwork,
}: {
  steps: Step[]
  artwork: readonly string[]
}) {
  return (
    <div className="space-y-12">
      {steps.map((step, index) => {
        const reverse = index % 2 === 1

        return (
          <div key={step.title} className="grid items-center gap-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
            <div className={reverse ? 'lg:order-2' : ''}>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b1929] text-sm font-bold text-white shadow-lg shadow-slate-900/10">
                {index + 1}
              </div>
              <h3 className="mt-5 text-2xl font-bold text-slate-950">{step.title}</h3>
              <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">{step.body}</p>
              {step.imageLabel ? (
                <div className="mt-5 inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-sky-800">
                  {step.imageLabel}
                </div>
              ) : null}
            </div>
            <div className={reverse ? 'lg:order-1' : ''}>
              <GuideImage src={artwork[index] ?? artwork[artwork.length - 1]} alt={step.title} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default async function GuidePage() {
  const t = await getTranslations('guide')
  const howSteps = t.raw('how.steps') as Step[]
  const buyerSteps = t.raw('buyers.steps') as Step[]
  const sellerSteps = t.raw('sellers.steps') as Step[]
  const trustCards = t.raw('trust.cards') as TrustCard[]
  const faqs = t.raw('faq.items') as Step[]

  return (
    <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_20%,#f8fafc_100%)]">
      <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:pb-20 sm:pt-20">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.20),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_35%)]" />
        <div className="relative mx-auto grid max-w-screen-xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-sky-700">{t('hero.eyebrow')}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{t('hero.body')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl bg-[#0b1929] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#15304d]"
              >
                {t('hero.browse')}
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/90 px-6 py-3.5 text-sm font-bold text-slate-900 transition-colors hover:bg-white"
              >
                {t('hero.sell')}
              </Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {howSteps.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Step {index + 1}
                    </span>
                    <span className="text-sky-700">
                      <Icon name={howIcons[index]} />
                    </span>
                  </div>
                  <p className="mt-4 text-base font-bold text-slate-950">{step.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
          <GuideImage src="/images/guide/hero-market.svg" alt={t('hero.imageLabel')} priority />
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-screen-xl">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid gap-4 md:grid-cols-3">
              {howSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-6 transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                    <Icon name={howIcons[index]} />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-slate-950">{step.title}</h2>
                  <p className="mt-2 leading-7 text-slate-600">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-screen-xl">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-sky-700">{t('buyers.eyebrow')}</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-950 sm:text-4xl">{t('buyers.title')}</h2>
          <div className="mt-10">
            <DetailSteps steps={buyerSteps} artwork={buyerArtwork} />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50/80 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-screen-xl">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-sky-700">{t('sellers.eyebrow')}</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-950 sm:text-4xl">{t('sellers.title')}</h2>
          <div className="mt-10">
            <DetailSteps steps={sellerSteps} artwork={sellerArtwork} />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-screen-xl">
          <div className="grid gap-4 md:grid-cols-3">
            {trustCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                  <Icon name={card.icon} />
                </div>
                <h2 className="mt-5 text-xl font-bold text-slate-950">{card.title}</h2>
                <p className="mt-2 leading-7 text-slate-600">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-3xl font-extrabold text-slate-950">{t('faq.title')}</h2>
            <div className="mt-8 divide-y divide-slate-200">
              {faqs.map((faq) => (
                <details key={faq.title} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-bold text-slate-950">
                    <span>{faq.title}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-xl text-slate-400 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-3xl leading-7 text-slate-600">{faq.body}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-4">
        <div className="mx-auto max-w-screen-xl overflow-hidden rounded-[36px] bg-[#0b1929] px-6 py-12 text-white shadow-[0_32px_100px_rgba(11,25,41,0.28)] sm:px-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-3xl font-extrabold sm:text-4xl">{t('cta.title')}</h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-300">{t('cta.body')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-white/50 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                {t('cta.browse')}
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#0b1929] transition-colors hover:bg-slate-100"
              >
                {t('cta.create')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
