import { GasResponse, PurchaseDraftResponse, User } from '@/types'

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL

type SignupPayload = {
  email: string
  password: string
  display_name: string
  first_name: string
  last_name: string
  country: string
  phone?: string
  birth_date?: string
  marketing_opt_in?: boolean
}

async function postToGas<T>(action: string, payload: Record<string, unknown>): Promise<GasResponse<T>> {
  if (!GAS_URL) {
    return {
      ok: false,
      code: 'GAS_URL_MISSING',
      message: 'NEXT_PUBLIC_GAS_URL is not configured.',
    }
  }

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({ action, ...payload }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        ok: false,
        code: 'HTTP_ERROR',
        message: 'Unable to reach the authentication service.',
      }
    }

    return response.json() as Promise<GasResponse<T>>
  } catch {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: 'ネットワークエラーが発生しました。しばらくしてから再度お試しください。',
    }
  }
}

export const gasClient = {
  signup(payload: SignupPayload) {
    return postToGas<{ verify_required: boolean; email: string }>('signup', payload)
  },
  verifyEmail(email: string, code: string) {
    return postToGas('verify_email', { email, code })
  },
  resendVerifyCode(email: string) {
    return postToGas('resend_verify_code', { email })
  },
  login(email: string, password: string) {
    return postToGas<User & { session_token: string }>('lootify_login', { email, password })
  },
  me(sessionToken: string) {
    return postToGas<User>('lootify_me', { session_token: sessionToken })
  },
  logout(sessionToken: string) {
    return postToGas('lootify_logout', { session_token: sessionToken })
  },
  createPurchaseDraft(sessionToken: string, itemId: string, itemTitle: string, itemPrice: number) {
    return postToGas<PurchaseDraftResponse>('create_purchase_draft', {
      session_token: sessionToken,
      item_id: itemId,
      item_title: itemTitle,
      item_price: itemPrice,
      currency: 'JPY',
      quantity: 1,
    })
  },
  getLifaiWallets() {
    return postToGas<{ wallets: Array<{ slot: number; wallet_address: string; label: string }> }>(
      'get_aisalon_wallets',
      {}
    )
  },
  getLifaiSellRequests(sessionToken: string) {
    return postToGas<{
      requests: Array<{
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
        confirmed_at: string
      }>
      wallet_address: string
    }>('get_aisalon_sell_requests', { session_token: sessionToken })
  },
  createLifaiSellRequest(payload: {
    session_token: string
    request_id: string
    lifai_plan: string
    ep_amount: number
    ep_rate_jpy: number
    usdt_rate_jpy: number
    gross_usdt: number
    fee_usdt: number
    net_usdt: number
    payout_network: string
    payout_wallet: string
  }) {
    return postToGas<{ request_id: string; platform_wallet: string }>('create_aisalon_sell_request', payload)
  },
  updateLifaiDepositStatus(payload: {
    api_key: string
    request_id: string
    status?: string
    received_ep?: number
    shortfall_ep?: number
    deposit_ids?: string[]
    source_login_ids?: string[]
    confirmed_at?: string
  }) {
    return postToGas<{ request_id: string }>('update_aisalon_deposit_status', payload)
  },
}
