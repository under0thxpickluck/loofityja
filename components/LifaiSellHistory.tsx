'use client'

import { useEffect, useState } from 'react'
import { authStorage } from '@/lib/auth-storage'
import { useTranslations } from 'next-intl'

type SellRequest = {
  request_id: string
  lifai_plan: string
  ep_amount: number
  net_usdt: number
  payout_network: string
  platform_wallet: string
  status: string
  created_at: string
  received_ep: number
  shortfall_ep: number
}

type DepositCheck = {
  state: 'checking' | 'waiting' | 'insufficient' | 'confirmed'
  receivedEp?: number
  shortfallEp?: number
}

export default function LifaiSellHistory() {
  const t = useTranslations('lifai')
  const [requests, setRequests] = useState<SellRequest[]>([])
  const [depositMap, setDepositMap] = useState<Record<string, DepositCheck>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authStorage.getToken()
    if (!token) { setLoading(false); return }

    fetch('/api/lifai/sell-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_token: token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.data?.requests) {
          setRequests(data.data.requests)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function checkDeposit(req: SellRequest) {
    const token = authStorage.getToken()
    if (!token) return
    setDepositMap(prev => ({ ...prev, [req.request_id]: { state: 'checking' } }))
    try {
      const res = await fetch('/api/lifai/deposit-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token, request_id: req.request_id }),
      })
      const data = await res.json()
      if (data.ok) {
        const state =
          data.state === 'confirmed' ? 'confirmed' :
          data.state === 'insufficient' ? 'insufficient' : 'waiting'
        setDepositMap(prev => ({
          ...prev,
          [req.request_id]: { state, receivedEp: data.received_ep, shortfallEp: data.shortfall_ep },
        }))
        if (state === 'confirmed') {
          setRequests(prev => prev.map(r => (r.request_id === req.request_id ? { ...r, status: '入金確認済み' } : r)))
        }
        return
      }
    } catch {}
    setDepositMap(prev => ({ ...prev, [req.request_id]: { state: 'waiting' } }))
  }

  function statusBadgeClass(status: string) {
    if (status === '入金確認済み') return 'bg-emerald-100 text-emerald-700'
    if (status === '入金不足') return 'bg-red-100 text-red-700'
    return 'bg-amber-100 text-amber-700'
  }

  function statusLabel(status: string) {
    if (status === '入金確認済み') return t('statusConfirmed')
    if (status === '入金不足') return t('statusInsufficient')
    if (status === '入金待ち' || status === 'pending') return t('statusWaiting')
    return status
  }

  if (loading) return null
  if (requests.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-base font-bold text-[#0b1929]">{t('sellHistoryTitle')}</h2>
      <div className="space-y-3">
        {requests.map(req => {
          const depositStatus = depositMap[req.request_id]
          return (
            <div key={req.request_id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-mono text-xs text-gray-400">{req.request_id}</p>
                  <p className="font-semibold text-gray-900">
                    {req.ep_amount.toLocaleString()} EP → <span className="text-emerald-700">{req.net_usdt} USDT</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {req.payout_network} · {new Date(req.created_at).toLocaleString('ja-JP')}
                  </p>
                  <p className="font-mono text-xs text-sky-700">{req.platform_wallet}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(req.status)}`}>
                    {statusLabel(req.status)}
                  </span>
                  {req.status !== '入金確認済み' && depositStatus?.state !== 'checking' && depositStatus?.state !== 'confirmed' && (
                    <button
                      onClick={() => checkDeposit(req)}
                      className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-700 hover:bg-sky-100"
                    >
                      {depositStatus ? t('recheckDeposit') : t('checkDeposit')}
                    </button>
                  )}
                  {depositStatus?.state === 'checking' && (
                    <p className="text-xs text-amber-600">{t('depositWaiting')}</p>
                  )}
                  {depositStatus?.state === 'insufficient' && (
                    <p className="max-w-[220px] text-right text-xs font-semibold text-red-600">
                      {t('depositInsufficient', {
                        received: String(depositStatus.receivedEp ?? 0),
                        shortfall: String(depositStatus.shortfallEp ?? 0),
                      })}
                    </p>
                  )}
                  {depositStatus?.state === 'confirmed' && (
                    <p className="text-xs font-semibold text-emerald-600">{t('depositConfirmed')}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
