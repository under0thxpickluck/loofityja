import { evaluateDeposits, LfwDeposit } from '../lifai-deposit'

function dep(partial: Partial<LfwDeposit>): LfwDeposit {
  return {
    deposit_id: 'LFW-DEP-X',
    from_login_id: 'user01',
    amount: 0,
    status: 'pending',
    created_at: '2026-06-11T00:00:00.000Z',
    consumed_by: '',
    ...partial,
  }
}

describe('evaluateDeposits', () => {
  const REQ = 'LIFAI-ABC123'

  it('入金ゼロなら waiting で不足=必要数', () => {
    const r = evaluateDeposits([], REQ, 1000)
    expect(r.state).toBe('waiting')
    expect(r.receivedEp).toBe(0)
    expect(r.shortfallEp).toBe(1000)
    expect(r.pendingDepositIds).toEqual([])
  })

  it('不足なら insufficient で不足額を返す', () => {
    const r = evaluateDeposits([dep({ deposit_id: 'D1', amount: 400 })], REQ, 1000)
    expect(r.state).toBe('insufficient')
    expect(r.receivedEp).toBe(400)
    expect(r.shortfallEp).toBe(600)
    expect(r.pendingDepositIds).toEqual(['D1'])
  })

  it('複数入金の合計がちょうどなら confirmed・過剰0', () => {
    const r = evaluateDeposits(
      [dep({ deposit_id: 'D1', amount: 400 }), dep({ deposit_id: 'D2', amount: 600, from_login_id: 'user02' })],
      REQ, 1000
    )
    expect(r.state).toBe('confirmed')
    expect(r.receivedEp).toBe(1000)
    expect(r.overpaidEp).toBe(0)
    expect(r.pendingDepositIds).toEqual(['D1', 'D2'])
    expect(r.usableDepositIds).toEqual(['D1', 'D2'])
    expect(r.sourceLoginIds).toEqual(['user01', 'user02'])
  })

  it('過剰なら confirmed で超過分を返す（そのまま成立）', () => {
    const r = evaluateDeposits([dep({ deposit_id: 'D1', amount: 1500 })], REQ, 1000)
    expect(r.state).toBe('confirmed')
    expect(r.overpaidEp).toBe(500)
  })

  it('他申請で消費済みの入金は数えない', () => {
    const r = evaluateDeposits(
      [dep({ deposit_id: 'D1', amount: 1000, status: 'consumed', consumed_by: 'LIFAI-OTHER' })],
      REQ, 1000
    )
    expect(r.state).toBe('waiting')
  })

  it('この申請で消費済みの入金は数える（書き戻しリトライの冪等性）', () => {
    const r = evaluateDeposits(
      [dep({ deposit_id: 'D1', amount: 1000, status: 'consumed', consumed_by: REQ })],
      REQ, 1000
    )
    expect(r.state).toBe('confirmed')
    expect(r.pendingDepositIds).toEqual([]) // 再consumeは不要
    expect(r.usableDepositIds).toEqual(['D1'])
  })

  it('amountが数値でない行は0として扱う', () => {
    const r = evaluateDeposits([dep({ deposit_id: 'D1', amount: NaN })], REQ, 1000)
    expect(r.state).toBe('waiting')
  })
})
