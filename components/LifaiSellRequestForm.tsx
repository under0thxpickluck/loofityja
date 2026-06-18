'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter, usePathname } from '@/i18n/navigation'
import { LifaiPlan } from '@/types'
import { EP_RATE_JPY, FEE_RATE, LIFAI_PLANS, PAYOUT_NETWORKS } from '@/lib/lifai'
import { useAuth } from '@/contexts/AuthContext'
import { authStorage } from '@/lib/auth-storage'

const AUTH_ERROR_CODES = ['MISSING_TOKEN', 'INVALID_TOKEN', 'SESSION_EXPIRED', 'USER_NOT_FOUND']

type SubmitResult = {
  request_id: string
  net_usdt: number
  platform_wallet: string
}

type DepositInfo = {
  state: 'waiting' | 'insufficient' | 'confirmed' | 'timeout'
  receivedEp: number
  shortfallEp: number
  overpaidEp: number
}

const INITIAL_DEPOSIT: DepositInfo = { state: 'waiting', receivedEp: 0, shortfallEp: 0, overpaidEp: 0 }

export default function LifaiSellRequestForm() {
  const t = useTranslations('lifai')
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const [selectedPlan, setSelectedPlan] = useState<LifaiPlan>('starter')
  const [epAmount, setEpAmount] = useState('1000')
  const [payoutNetwork, setPayoutNetwork] = useState('TRC20')
  const [payoutWallet, setPayoutWallet] = useState('')

  const [jpyPerUsdt, setJpyPerUsdt] = useState<number | null>(null)
  const [rateUpdatedAt, setRateUpdatedAt] = useState<string>('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState<SubmitResult | null>(null)
  const [depositInfo, setDepositInfo] = useState<DepositInfo>(INITIAL_DEPOSIT)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=jpy')
      .then((r) => r.json())
      .then((data: { tether: { jpy: number } }) => {
        setJpyPerUsdt(data.tether.jpy)
        const now = new Date()
        setRateUpdatedAt(
          `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        )
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const epValue = Number(epAmount) || 0
  const epRateJpy = EP_RATE_JPY[selectedPlan]

  const { grossUsdt, feeUsdt, netUsdt } = useMemo(() => {
    if (!jpyPerUsdt || epValue <= 0) return { grossUsdt: 0, feeUsdt: 0, netUsdt: 0 }
    const gross = (epValue * epRateJpy) / jpyPerUsdt
    const fee = gross * FEE_RATE
    return {
      grossUsdt: Number(gross.toFixed(4)),
      feeUsdt: Number(fee.toFixed(4)),
      netUsdt: Number((gross - fee).toFixed(4)),
    }
  }, [epValue, epRateJpy, jpyPerUsdt])

  const POLL_INTERVAL_MS = 30_000
  const MAX_ATTEMPTS = 20 // 30秒 × 20回 = 10分

  async function checkDepositOnce(requestId: string): Promise<boolean> {
    const token = authStorage.getToken()
    if (!token) return false
    try {
      const res = await fetch('/api/lifai/deposit-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token, request_id: requestId }),
      })
      const data = await res.json()
      if (data.ok) {
        setDepositInfo({
          state: data.state,
          receivedEp: data.received_ep ?? 0,
          shortfallEp: data.shortfall_ep ?? 0,
          overpaidEp: data.overpaid_ep ?? 0,
        })
        return data.state === 'confirmed'
      }
    } catch {}
    return false
  }

  function startPolling(requestId: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    setDepositInfo(INITIAL_DEPOSIT)
    let attempts = 0
    void checkDepositOnce(requestId)
    pollRef.current = setInterval(async () => {
      attempts++
      const confirmed = await checkDepositOnce(requestId)
      if (confirmed) {
        if (pollRef.current) clearInterval(pollRef.current)
        return
      }
      if (attempts >= MAX_ATTEMPTS) {
        setDepositInfo((prev) => (prev.state === 'confirmed' ? prev : { ...prev, state: 'timeout' }))
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, POLL_INTERVAL_MS)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const formData = new FormData(event.currentTarget)
    const planConfirmed = formData.get('planConfirmed') === 'on'
    const transferConfirmed = formData.get('transferConfirmed') === 'on'
    const walletConfirmed = formData.get('walletConfirmed') === 'on'

    if (!planConfirmed || !transferConfirmed || !walletConfirmed) {
      setError(t('confirmError'))
      return
    }
    if (epValue < 100) {
      setError(t('epMinimumError'))
      return
    }
    if (!payoutWallet.trim()) {
      setError(t('payoutWalletError'))
      return
    }

    const token = authStorage.getToken()
    if (!token) {
      setError(t('submitError'))
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/lifai/sell-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: token,
          lifai_plan: selectedPlan,
          ep_amount: epValue,
          payout_network: payoutNetwork,
          payout_wallet: payoutWallet.trim(),
        }),
      })
      const data = await response.json()
      if (data.ok) {
        setSubmitted({ request_id: data.request_id, net_usdt: data.net_usdt, platform_wallet: data.platform_wallet ?? '' })
        startPolling(data.request_id)
      } else if (data.error === 'OPEN_REQUEST_EXISTS') {
        setError(t('openRequestExists'))
      } else if (AUTH_ERROR_CODES.includes(data.error)) {
        authStorage.clearSession()
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      } else {
        setError(t('submitError'))
      }
    } catch {
      setError(t('submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  // 申請送信後の画面
  if (submitted) {
    const lfw = submitted.platform_wallet || user?.wallet_address || ''
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">{t('submitSuccess', { id: submitted.request_id })}</p>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-white p-6 shadow-sm space-y-3">
          <p className="text-base font-bold text-[#0b1929]">{t('sendEpTitle')}</p>
          <p className="text-sm text-gray-500">{t('sendEpInstruction')}</p>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{t('walletSectionTitle')}</p>
            <p className="mt-1 font-mono text-lg font-bold tracking-widest text-[#0b1929]">{lfw}</p>
            <p className="mt-1 text-xs text-gray-500">{t('sendEpAmountNote', { amount: String(epValue) })}</p>
          </div>

          {depositInfo.state === 'waiting' && (
            <p className="text-sm text-amber-700">{t('depositWaiting')}</p>
          )}
          {depositInfo.state === 'insufficient' && (
            <p className="text-sm font-semibold text-red-600">
              {t('depositInsufficient', { received: String(depositInfo.receivedEp), shortfall: String(depositInfo.shortfallEp) })}
            </p>
          )}
          {depositInfo.state === 'confirmed' && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-700">{t('depositConfirmed')}</p>
              {depositInfo.overpaidEp > 0 && (
                <p className="text-xs text-gray-500">{t('depositOverpaid', { overpaid: String(depositInfo.overpaidEp) })}</p>
              )}
            </div>
          )}
          {depositInfo.state === 'timeout' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">{t('depositTimeout')}</p>
              <button
                type="button"
                onClick={() => submitted && startPolling(submitted.request_id)}
                className="rounded border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
              >
                {t('recheckDeposit')}
              </button>
            </div>
          )}
        </div>

        <Link href="/pc/lifai" className="inline-block text-sm font-medium text-sky-700 hover:underline">
          {t('backToLifai')}
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#0b1929]">{t('sellTitle')}</h1>
          <p className="mt-2 text-sm text-gray-500">{t('sellSubtitle')}</p>
        </div>

        {error ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

        {/* プラン選択 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-800">{t('planHeading')}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LIFAI_PLANS.map((plan) => (
              <label
                key={plan}
                className={`cursor-pointer rounded-xl border p-3 ${
                  selectedPlan === plan ? 'border-sky-500 bg-sky-50' : 'border-gray-200 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  value={plan}
                  checked={selectedPlan === plan}
                  onChange={() => setSelectedPlan(plan)}
                  className="sr-only"
                />
                <p className="text-sm font-bold text-gray-900">{t(`plans.${plan}.name`)}</p>
                <p className="mt-1 text-xs text-gray-500">{t(`plans.${plan}.desc`)}</p>
              </label>
            ))}
          </div>
        </div>

        {/* EP数量 */}
        <div>
          <label htmlFor="lifai-ep-amount" className="mb-1 block text-sm font-medium text-gray-700">
            {t('epAmount')}
          </label>
          <input
            id="lifai-ep-amount"
            type="number"
            min={100}
            step={1}
            value={epAmount}
            onChange={(e) => setEpAmount(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
        </div>

        {/* ネットワーク / 受取ウォレット */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="lifai-payout-network" className="mb-1 block text-sm font-medium text-gray-700">
              {t('payoutNetwork')}
            </label>
            <select
              id="lifai-payout-network"
              value={payoutNetwork}
              onChange={(e) => setPayoutNetwork(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400"
            >
              {PAYOUT_NETWORKS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lifai-payout-wallet" className="mb-1 block text-sm font-medium text-gray-700">
              {t('payoutWallet')}
            </label>
            <input
              id="lifai-payout-wallet"
              type="text"
              value={payoutWallet}
              onChange={(e) => setPayoutWallet(e.target.value)}
              placeholder={t('payoutWalletPlaceholder')}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* 同意チェック */}
        <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          <label className="flex items-start gap-2">
            <input name="planConfirmed" type="checkbox" className="mt-0.5" />
            <span>{t('planConfirmed')}</span>
          </label>
          <label className="flex items-start gap-2">
            <input name="transferConfirmed" type="checkbox" className="mt-0.5" />
            <span>{t('transferConfirmed')}</span>
          </label>
          <label className="flex items-start gap-2">
            <input name="walletConfirmed" type="checkbox" className="mt-0.5" />
            <span>{t('walletConfirmed')}</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting || !user}
          className="w-full rounded-lg bg-[#0b1929] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0d2038] disabled:opacity-50"
        >
          {submitting ? t('submittingRequest') : t('submitRequest')}
        </button>
      </form>

      {/* サイドパネル */}
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0b1929]">{t('summaryHeading')}</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <div className="flex justify-between gap-4">
              <span>{t('selectedPlan')}</span>
              <span className="font-semibold text-gray-900">{t(`plans.${selectedPlan}.name`)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{t('epLabel')}</span>
              <span className="font-semibold text-gray-900">{epValue.toLocaleString('en-US')} EP</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{t('epRateLabel')}</span>
              <span className="font-semibold text-gray-900">{t('epRateValue', { rate: String(epRateJpy) })}</span>
            </div>
            {jpyPerUsdt && (
              <div className="flex justify-between gap-4">
                <span>{t('usdtRateLabel')}</span>
                <span className="font-semibold text-gray-900">{jpyPerUsdt.toFixed(2)} 円</span>
              </div>
            )}
            <hr className="border-gray-100" />
            <div className="flex justify-between gap-4">
              <span>{t('grossLabel')}</span>
              <span className="font-semibold text-gray-900">{grossUsdt.toLocaleString('en-US')} USDT</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{t('feeLabel')} ({t('feeValue')})</span>
              <span className="font-semibold text-red-600">-{feeUsdt.toLocaleString('en-US')} USDT</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-gray-100 pt-2">
              <span className="font-semibold">{t('netLabel')}</span>
              <span className="text-base font-bold text-emerald-700">{netUsdt.toLocaleString('en-US')} USDT</span>
            </div>
            {rateUpdatedAt && (
              <p className="text-right text-xs text-gray-400">{t('rateUpdatedAt', { time: rateUpdatedAt })}</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0b1929]">{t('stepsHeading')}</h2>
          <ol className="mt-4 space-y-3 text-sm text-gray-600">
            <li>{t('steps.1')}</li>
            <li>{t('steps.2')}</li>
            <li>{t('steps.3')}</li>
            <li>{t('steps.4')}</li>
          </ol>
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">{t('warningTitle')}</p>
            <div className="mt-2 space-y-1">
              {t('warningBody').split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
          <Link href="/pc/lifai" className="mt-5 inline-block text-sm font-medium text-sky-700 hover:underline">
            {t('backToLifai')}
          </Link>
        </section>
      </div>
    </div>
  )
}
