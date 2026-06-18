export type Game = {
  id: number
  name: string
  slug: string
  category: 'pc' | 'mobile' | 'other'
  listingCount: number
}

export type Listing = {
  id: number
  gameId: number
  gameName: string
  title: string
  price: number
  imageUrl: string
}

export type User = {
  id: string
  email: string
  display_name: string
  first_name: string
  last_name: string
  country: string
  phone?: string | null
  email_verified: boolean
  last_login?: string | null
  wallet_address: string
}

export type GasResponse<T = Record<string, unknown>> = {
  ok: boolean
  code: string
  message: string
  data?: T
}

export type PurchaseDraftResponse = {
  draft_id: string
  checkout_token: string
  payment_url: string
}

export type LifaiPlan = 'starter' | 'builder' | 'automation' | 'core' | 'infra'

export type LifaiSellRequest = {
  requestId: string
  lifaiPlan: LifaiPlan
  epAmount: number
  epRateJpy: number
  usdtRateJpy: number
  grossUsdt: number
  feeUsdt: number
  netUsdt: number
  sourceWallet: string
  payoutNetwork: string
  payoutWallet: string
  platformWallet: string
}

export type LifaiWalletResponse = {
  ok: boolean
  wallet_address: string
  label: string
  next_rotate_at: string // ISO 8601
}
