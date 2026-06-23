import { LfwDeposit } from '@/lib/lifai-deposit'

/**
 * Aisalon GASのクライアント（デポジット確認専用）。サーバー専用。
 * 環境変数 AISALON_GAS_URL / AISALON_GAS_KEY を使用。
 * クライアントコンポーネントからimportしないこと。
 */
async function callAisalonAdmin<T>(payload: Record<string, unknown>): Promise<T | null> {
  const gasUrl = process.env.AISALON_GAS_URL
  const gasKey = process.env.AISALON_GAS_KEY
  if (!gasUrl || !gasKey) {
    console.error('[aisalon-client] AISALON_GAS_URL / AISALON_GAS_KEY is not set')
    return null
  }
  try {
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      cache: 'no-store',
      body: JSON.stringify({ api_key: gasKey, ...payload }),
    })
    return (await res.json()) as T
  } catch (err) {
    console.error('[aisalon-client] request failed:', err)
    return null
  }
}

export type LifaiovCheckResult = { ok: boolean; deposits?: LfwDeposit[]; error?: string }
export type LifaiovConsumeResult = { ok: boolean; consumed?: number; error?: string }

/**
 * aisalon GAS の check_aisalon_gift_deposits アクションを呼び出す。
 * platform_wallet はasisalon内の運営login_idに対応する。
 */
export function checkLfwDeposits(lfwAddress: string): Promise<LifaiovCheckResult | null> {
  return callAisalonAdmin<LifaiovCheckResult>({
    action: 'check_aisalon_gift_deposits',
    platform_login_id: lfwAddress,
  })
}

export function consumeLfwDeposits(
  lfwAddress: string,
  depositIds: string[],
  consumedBy: string
): Promise<LifaiovConsumeResult | null> {
  return callAisalonAdmin<LifaiovConsumeResult>({
    action: 'consume_aisalon_gift_deposits',
    platform_login_id: lfwAddress,
    deposit_ids: depositIds,
    consumed_by: consumedBy,
  })
}
