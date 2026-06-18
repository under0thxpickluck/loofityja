import { NextResponse } from 'next/server'
import { gasClient } from '@/lib/gas-client'
import { checkLfwDeposits, consumeLfwDeposits } from '@/lib/lifaiov-client'
import { evaluateDeposits } from '@/lib/lifai-deposit'

export const runtime = 'nodejs'

const STATUS_CONFIRMED = '入金確認済み'
const STATUS_INSUFFICIENT = '入金不足'

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const sessionToken = String(body?.session_token ?? '').trim()
  const requestId = String(body?.request_id ?? '').trim()
  if (!sessionToken || !requestId) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 })
  }

  // APIキー未設定のままAisalon側で入金を消費してしまわないよう、外部呼び出し前に検証する
  const apiKey = process.env.AISALON_GAS_KEY ?? process.env.LOOTIFY_GAS_KEY ?? ''
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 500 })
  }

  // 本人確認: 自分の申請一覧に request_id があることを検証（他人の申請は照会不可）
  const list = await gasClient.getLifaiSellRequests(sessionToken)
  if (!list.ok || !list.data) {
    return NextResponse.json({ ok: false, error: list.code || 'unauthorized' }, { status: 401 })
  }
  const request = list.data.requests.find((r) => r.request_id === requestId)
  if (!request) {
    return NextResponse.json({ ok: false, error: 'request_not_found' }, { status: 404 })
  }

  const requiredEp = Number(request.ep_amount) || 0

  // 確認済みならLIFAIOVを呼ばず即返す
  if (request.status === STATUS_CONFIRMED) {
    const received = Number(request.received_ep) || requiredEp
    return NextResponse.json({
      ok: true, state: 'confirmed',
      required_ep: requiredEp, received_ep: received,
      shortfall_ep: 0, overpaid_ep: Math.max(0, received - requiredEp),
    })
  }

  const check = await checkLfwDeposits(request.platform_wallet)
  if (!check || !check.ok || !Array.isArray(check.deposits)) {
    return NextResponse.json({ ok: false, error: 'lifaiov_unreachable' }, { status: 502 })
  }

  const result = evaluateDeposits(check.deposits, requestId, requiredEp)

  if (result.state === 'confirmed') {
    // 1) 充当する入金をLIFAIOV側で消費済みにする（先に実行。失敗したら書き戻さない）
    if (result.pendingDepositIds.length > 0) {
      const consumed = await consumeLfwDeposits(request.platform_wallet, result.pendingDepositIds, requestId)
      if (!consumed || !consumed.ok) {
        return NextResponse.json({ ok: false, error: 'consume_failed' }, { status: 502 })
      }
    }
    // 2) シートへ書き戻し（失敗しても入金はこの申請IDで消費済みのため、再チェックで復旧する）
    const update = await gasClient.updateLifaiDepositStatus({
      api_key: apiKey,
      request_id: requestId,
      status: STATUS_CONFIRMED,
      received_ep: result.receivedEp,
      shortfall_ep: 0,
      deposit_ids: result.usableDepositIds,
      source_login_ids: result.sourceLoginIds,
      confirmed_at: new Date().toISOString(),
    })
    if (!update.ok) {
      return NextResponse.json({ ok: false, error: 'sheet_update_failed' }, { status: 502 })
    }
  } else if (result.state === 'insufficient') {
    const update = await gasClient.updateLifaiDepositStatus({
      api_key: apiKey,
      request_id: requestId,
      status: STATUS_INSUFFICIENT,
      received_ep: result.receivedEp,
      shortfall_ep: result.shortfallEp,
      deposit_ids: result.usableDepositIds,
      source_login_ids: result.sourceLoginIds,
    })
    if (!update.ok) {
      // 書き戻し失敗はレスポンスには影響させない（ライブ照会結果は返せるため）が、調査用に記録する
      console.error('deposit-status: sheet write-back failed', { request_id: requestId, code: update.code })
    }
  } else {
    // waiting: 最終チェック日時のみ更新（statusは変えない）
    const update = await gasClient.updateLifaiDepositStatus({ api_key: apiKey, request_id: requestId })
    if (!update.ok) {
      console.error('deposit-status: sheet write-back failed', { request_id: requestId, code: update.code })
    }
  }

  return NextResponse.json({
    ok: true,
    state: result.state,
    required_ep: requiredEp,
    received_ep: result.receivedEp,
    shortfall_ep: result.shortfallEp,
    overpaid_ep: result.overpaidEp,
  })
}
