import { LifaiPlan } from '@/types'

export const EP_RATE_JPY: Record<LifaiPlan, number> = {
  starter: 0.25,
  builder: 0.2857,
  automation: 0.3333,
  core: 0.4,
  infra: 0.5,
}

export const LIFAI_PLANS = Object.keys(EP_RATE_JPY) as LifaiPlan[]
export const PAYOUT_NETWORKS = ['TRC20', 'ERC20', 'BEP20'] as const
export const FEE_RATE = 0.085
export const SIX_HOURS_MS = 21_600_000

type LifaiWalletSlot = {
  slot: number
  wallet_address: string
  label: string
}

export function getLifaiWalletSlot(wallets: LifaiWalletSlot[], nowMs = Date.now()) {
  const slotIndex = Math.floor(nowMs / SIX_HOURS_MS) % wallets.length
  return wallets[slotIndex]
}

export function getNextLifaiRotateAt(nowMs = Date.now()) {
  const currentSlotNum = Math.floor(nowMs / SIX_HOURS_MS)
  return new Date((currentSlotNum + 1) * SIX_HOURS_MS).toISOString()
}
