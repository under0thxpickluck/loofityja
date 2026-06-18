export type LfwDeposit = {
  deposit_id: string
  from_login_id: string
  amount: number
  status: string
  created_at: string
  consumed_by?: string
}

export type DepositState = 'waiting' | 'insufficient' | 'confirmed'

export type DepositEvaluation = {
  state: DepositState
  receivedEp: number
  shortfallEp: number
  overpaidEp: number
  /** statusがpendingで、確認成立時にconsumeすべき入金ID */
  pendingDepositIds: string[]
  /** この申請に充当される全入金ID（pending + 本申請でconsumed済み） */
  usableDepositIds: string[]
  /** 充当入金の送信元LIFAIOVログインID（重複除去） */
  sourceLoginIds: string[]
}

/**
 * 申請に充当できる入金 = 未消費(pending) + この申請IDで消費済み。
 * consume後にシート書き戻しが失敗しても、再評価で同じ結果になる（冪等）。
 */
export function evaluateDeposits(
  deposits: LfwDeposit[],
  requestId: string,
  requiredEp: number
): DepositEvaluation {
  const usable = deposits.filter(
    (d) => d.status === 'pending' || (requestId !== '' && d.consumed_by === requestId)
  )
  const receivedEp = usable.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

  if (receivedEp <= 0) {
    return {
      state: 'waiting',
      receivedEp: 0,
      shortfallEp: requiredEp,
      overpaidEp: 0,
      pendingDepositIds: [],
      usableDepositIds: [],
      sourceLoginIds: [],
    }
  }

  const pendingDepositIds = usable.filter((d) => d.status === 'pending').map((d) => d.deposit_id)
  const usableDepositIds = usable.map((d) => d.deposit_id)
  const sourceLoginIds = Array.from(new Set(usable.map((d) => d.from_login_id).filter(Boolean)))

  if (receivedEp < requiredEp) {
    return {
      state: 'insufficient',
      receivedEp,
      shortfallEp: requiredEp - receivedEp,
      overpaidEp: 0,
      pendingDepositIds,
      usableDepositIds,
      sourceLoginIds,
    }
  }

  return {
    state: 'confirmed',
    receivedEp,
    shortfallEp: 0,
    overpaidEp: receivedEp - requiredEp,
    pendingDepositIds,
    usableDepositIds,
    sourceLoginIds,
  }
}
