/**
 * @jest-environment node
 */
import { POST } from '@/app/api/lifai/sell-request/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/gas-client', () => ({
  gasClient: {
    createLifaiSellRequest: jest.fn(),
  },
}))

global.fetch = jest.fn()

import { gasClient } from '@/lib/gas-client'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/lifai/sell-request', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const validBody = {
  session_token: 'tok-valid',
  lifai_plan: 'core',
  ep_amount: 1000,
  payout_network: 'TRC20',
  payout_wallet: 'TXabc123',
}

describe('POST /api/lifai/sell-request', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(gasClient.createLifaiSellRequest as jest.Mock).mockResolvedValue({
      ok: true,
      data: { request_id: 'LIFAI-ABC123', platform_wallet: 'LFW-AAAAAA' },
    })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tether: { jpy: 150 } }),
    })
  })

  it('有効なリクエストで 200 と申請ID・net_usdt・platform_wallet を返す', async () => {
    const req = makeRequest(validBody)
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(body.request_id).toBeDefined()
    // core plan: 1000 EP × 0.4円 = 400円 / 150円/USDT = 2.6667 USDT gross
    // fee: 2.6667 × 0.085 = 0.2267; net ≈ 2.44
    expect(body.net_usdt).toBeCloseTo(2.44, 1)
    expect(body.platform_wallet).toBe('LFW-AAAAAA')
  })

  it('GAS に session_token・payout_wallet・計算済み金額を渡し、ウォレットは渡さない', async () => {
    const req = makeRequest(validBody)
    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(gasClient.createLifaiSellRequest).toHaveBeenCalledTimes(1)
    expect(gasClient.createLifaiSellRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        session_token: 'tok-valid',
        lifai_plan: 'core',
        ep_amount: 1000,
        ep_rate_jpy: 0.4,
        usdt_rate_jpy: 150,
        // core plan: 1000 EP × 0.4円 = 400円 / 150円/USDT = 2.6667 USDT gross
        gross_usdt: 2.6667,
        fee_usdt: 0.2267,
        net_usdt: 2.44,
        payout_network: 'TRC20',
        payout_wallet: 'TXabc123',
      })
    )
    const sentPayload = (gasClient.createLifaiSellRequest as jest.Mock).mock.calls[0][0]
    expect(sentPayload).not.toHaveProperty('platform_wallet')
    expect(sentPayload).not.toHaveProperty('source_wallet')
  })

  it('session_token が未指定の場合 401 MISSING_TOKEN を返す', async () => {
    const { session_token: _omit, ...bodyWithout } = validBody
    const req = makeRequest(bodyWithout)
    const response = await POST(req)
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('MISSING_TOKEN')
  })

  it('不正な JSON の場合 400 invalid_json を返す', async () => {
    const req = new NextRequest('http://localhost/api/lifai/sell-request', {
      method: 'POST',
      body: '{bad',
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('invalid_json')
  })

  it('ep_amount が 100 未満の場合 400 を返す', async () => {
    const req = makeRequest({ ...validBody, ep_amount: 50 })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('ep_amount が整数でない場合 400 を返す', async () => {
    const req = makeRequest({ ...validBody, ep_amount: 100.5 })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('ep_amount が数値以外の場合 400 を返す', async () => {
    const req = makeRequest({ ...validBody, ep_amount: '1000' })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('不明なプランの場合 400 を返す', async () => {
    const req = makeRequest({ ...validBody, lifai_plan: 'diamond' })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('payout_network が不正な場合 400 を返す', async () => {
    const req = makeRequest({ ...validBody, payout_network: 'SOL' })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Invalid payout_network')
  })

  it('payout_wallet が未入力の場合 400 を返す', async () => {
    const req = makeRequest({ ...validBody, payout_wallet: '' })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('GAS が OPEN_REQUEST_EXISTS を返した場合 409 を返す', async () => {
    ;(gasClient.createLifaiSellRequest as jest.Mock).mockResolvedValue({
      ok: false,
      code: 'OPEN_REQUEST_EXISTS',
      data: { request_id: 'LIFAI-OLD111' },
    })
    const req = makeRequest(validBody)
    const response = await POST(req)
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error).toBe('OPEN_REQUEST_EXISTS')
    expect(body.open_request_id).toBe('LIFAI-OLD111')
  })

  it('GAS が INVALID_TOKEN を返した場合 401 を返す', async () => {
    ;(gasClient.createLifaiSellRequest as jest.Mock).mockResolvedValue({
      ok: false,
      code: 'INVALID_TOKEN',
    })
    const req = makeRequest(validBody)
    const response = await POST(req)
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('INVALID_TOKEN')
  })

  it('GAS が INTERNAL_ERROR を返した場合 500 を返す', async () => {
    ;(gasClient.createLifaiSellRequest as jest.Mock).mockResolvedValue({
      ok: false,
      code: 'INTERNAL_ERROR',
    })
    const req = makeRequest(validBody)
    const response = await POST(req)
    expect(response.status).toBe(500)
  })

  it('CoinGecko API 失敗時に 502 を返す', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })
    const req = makeRequest(validBody)
    const response = await POST(req)
    expect(response.status).toBe(502)
  })

  it('CoinGecko が為替レート 0 を返した場合 502 を返す', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tether: { jpy: 0 } }),
    })
    const req = makeRequest(validBody)
    const response = await POST(req)
    expect(response.status).toBe(502)
  })
})
