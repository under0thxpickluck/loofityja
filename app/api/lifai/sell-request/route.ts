import { NextRequest, NextResponse } from 'next/server'
import { gasClient } from '@/lib/gas-client'
import { LifaiPlan } from '@/types'
import { EP_RATE_JPY, FEE_RATE, LIFAI_PLANS, PAYOUT_NETWORKS } from '@/lib/lifai'

function makeRequestId(): string {
  return 'LIFAI-' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

async function fetchJpyPerUsdt(): Promise<number> {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=jpy',
    { cache: 'no-store' }
  )
  if (!response.ok) throw new Error('CoinGecko fetch failed')
  const data = await response.json() as { tether: { jpy: number } }
  const jpy = data.tether.jpy
  if (typeof jpy !== 'number' || !Number.isFinite(jpy) || jpy <= 0) throw new Error('Invalid exchange rate')
  return jpy
}

const AUTH_ERROR_CODES = ['MISSING_TOKEN', 'INVALID_TOKEN', 'SESSION_EXPIRED', 'USER_NOT_FOUND']

export async function POST(req: NextRequest) {
  let body: {
    session_token?: string
    lifai_plan?: string
    ep_amount?: number
    payout_network?: string
    payout_wallet?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const { lifai_plan, ep_amount, payout_network, payout_wallet } = body
  const sessionToken = String(body.session_token ?? '').trim()

  if (!sessionToken) {
    return NextResponse.json({ ok: false, error: 'MISSING_TOKEN' }, { status: 401 })
  }
  if (!LIFAI_PLANS.includes(lifai_plan as LifaiPlan)) {
    return NextResponse.json({ ok: false, error: 'Invalid lifai_plan' }, { status: 400 })
  }
  if (typeof ep_amount !== 'number' || !Number.isFinite(ep_amount) || !Number.isInteger(ep_amount) || ep_amount < 100) {
    return NextResponse.json({ ok: false, error: 'ep_amount must be an integer of at least 100' }, { status: 400 })
  }
  if (!PAYOUT_NETWORKS.includes(payout_network as (typeof PAYOUT_NETWORKS)[number])) {
    return NextResponse.json({ ok: false, error: 'Invalid payout_network' }, { status: 400 })
  }
  if (!payout_wallet?.trim()) {
    return NextResponse.json({ ok: false, error: 'payout_wallet is required' }, { status: 400 })
  }

  let jpyPerUsdt: number
  try {
    jpyPerUsdt = await fetchJpyPerUsdt()
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to fetch exchange rate' }, { status: 502 })
  }

  const plan = lifai_plan as LifaiPlan
  const epRateJpy = EP_RATE_JPY[plan]
  const grossJpy = ep_amount * epRateJpy
  const grossUsdt = grossJpy / jpyPerUsdt
  const feeUsdt = grossUsdt * FEE_RATE
  const netUsdt = grossUsdt - feeUsdt

  const requestId = makeRequestId()

  const saveResult = await gasClient.createLifaiSellRequest({
    session_token: sessionToken,
    request_id: requestId,
    lifai_plan: plan,
    ep_amount,
    ep_rate_jpy: epRateJpy,
    usdt_rate_jpy: jpyPerUsdt,
    gross_usdt: Number(grossUsdt.toFixed(4)),
    fee_usdt: Number(feeUsdt.toFixed(4)),
    net_usdt: Number(netUsdt.toFixed(4)),
    payout_network: payout_network as string,
    payout_wallet: payout_wallet.trim(),
  })

  if (!saveResult.ok) {
    if (saveResult.code === 'OPEN_REQUEST_EXISTS') {
      return NextResponse.json(
        { ok: false, error: 'OPEN_REQUEST_EXISTS', open_request_id: saveResult.data?.request_id },
        { status: 409 }
      )
    }
    if (AUTH_ERROR_CODES.includes(saveResult.code)) {
      return NextResponse.json({ ok: false, error: saveResult.code }, { status: 401 })
    }
    return NextResponse.json({ ok: false, error: 'Failed to save request' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    request_id: requestId,
    net_usdt: Number(netUsdt.toFixed(4)),
    gross_usdt: Number(grossUsdt.toFixed(4)),
    fee_usdt: Number(feeUsdt.toFixed(4)),
    ep_rate_jpy: epRateJpy,
    usdt_rate_jpy: jpyPerUsdt,
    platform_wallet: saveResult.data?.platform_wallet ?? '',
  })
}
