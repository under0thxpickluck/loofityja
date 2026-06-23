import { fireEvent, render, screen, waitFor, act } from '@testing-library/react'

global.fetch = jest.fn()

const mockGetToken = jest.fn()

jest.mock('@/lib/auth-storage', () => ({
  authStorage: {
    getToken: () => mockGetToken(),
  },
}))

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com', wallet_address: 'LFW-TEST01' },
  }),
}))

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    const messages: Record<string, string> = {
      sellTitle: 'LIFAI EP Sell Request',
      sellSubtitle: 'Confirm your plan.',
      planHeading: 'Choose a payout plan',
      'plans.starter.name': 'Starter',
      'plans.starter.desc': 'Best for first-time or low-volume sellers. (4 EP = 1 JPY)',
      'plans.builder.name': 'Builder',
      'plans.builder.desc': 'Balanced plan. (3.5 EP = 1 JPY)',
      'plans.automation.name': 'Automation',
      'plans.automation.desc': 'Efficient plan. (3 EP = 1 JPY)',
      'plans.core.name': 'Core',
      'plans.core.desc': 'Core-level plan. (2.5 EP = 1 JPY)',
      'plans.infra.name': 'Infra',
      'plans.infra.desc': 'Top-tier plan. (2 EP = 1 JPY)',
      epAmount: 'EP amount to sell',
      payoutNetwork: 'USDT payout network',
      payoutWallet: 'Your USDT wallet address',
      payoutWalletPlaceholder: 'Paste your destination wallet address',
      planConfirmed: 'I reviewed the selected plan, fee, and estimated payout before submitting.',
      transferConfirmed: 'I understand that I must send the exact EP amount to the LIFAI platform wallet after the request is confirmed.',
      walletConfirmed: 'I confirm that the payout wallet belongs to me and can receive USDT on the selected network.',
      submitRequest: 'Submit Sell Request',
      submittingRequest: 'Sending...',
      summaryHeading: 'Estimated settlement',
      selectedPlan: 'Selected plan',
      epLabel: 'EP amount',
      epRateLabel: 'EP rate',
      epRateValue: `${values?.rate ?? ''} JPY / EP`,
      feeLabel: 'Service fee',
      feeValue: '8.5%',
      grossLabel: 'Before fee',
      netLabel: 'Estimated payout',
      usdtRateLabel: 'JPY/USDT rate',
      rateUpdatedAt: `Rate as of ${values?.time ?? ''} JST`,
      stepsHeading: 'How settlement works',
      'steps.1': 'Submit the sell request.',
      'steps.2': 'Send EP to the displayed address.',
      'steps.3': 'Deposit is verified automatically.',
      'steps.4': 'Receive USDT after verification.',
      warningTitle: 'Important',
      warningBody: 'EP transfers are final.',
      backToLifai: 'Back to LIFAI overview',
      confirmError: 'You must confirm the plan and transfer acknowledgements before submitting.',
      epMinimumError: 'The minimum sell request is 100 EP.',
      payoutWalletError: 'Please enter your USDT payout wallet address.',
      submitSuccess: `Request ID: ${values?.id ?? ''} - A staff member will review and confirm.`,
      submitError: 'Submission failed. Please try again shortly.',
      sendEpTitle: 'Send EP from LIFAI',
      sendEpInstruction: 'Enter the address below as the recipient.',
      walletSectionTitle: 'Current EP destination wallet',
      sendEpAmountNote: `Amount to send: ${values?.amount ?? ''} EP`,
      depositWaiting: 'Waiting for EP deposit...',
      depositConfirmed: 'EP deposit confirmed. USDT transfer will be initiated.',
      depositTimeout: 'Deposit confirmation timed out.',
      openRequestExists: 'You already have an unfinished sell request.',
      depositInsufficient: `Insufficient deposit: received ${values?.received ?? ''} EP / ${values?.shortfall ?? ''} EP short.`,
      depositOverpaid: `We received ${values?.overpaid ?? ''} EP more than requested.`,
      recheckDeposit: 'Check again',
    }
    return messages[key] ?? key
  },
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

import LifaiSellRequestForm from '@/components/LifaiSellRequestForm'

const POLL_INTERVAL_MS = 30_000
const MAX_ATTEMPTS = 20

type FetchOverrides = {
  sell?: Record<string, unknown>
  deposit?: Record<string, unknown> | (() => Record<string, unknown>)
}

function setupFetchMock(overrides?: FetchOverrides) {
  ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (String(url).includes('/api/lifai/sell-request')) {
      return Promise.resolve({
        json: async () => overrides?.sell ?? { ok: true, request_id: 'LIFAI-ABCDEF', net_usdt: 2.29 },
      })
    }
    if (String(url).includes('/api/lifai/deposit-status')) {
      const deposit = overrides?.deposit
      return Promise.resolve({
        json: async () =>
          (typeof deposit === 'function' ? deposit() : deposit) ??
          { ok: true, state: 'waiting', required_ep: 1000, received_ep: 0, shortfall_ep: 1000, overpaid_ep: 0 },
      })
    }
    // CoinGecko rate
    return Promise.resolve({ json: async () => ({ tether: { jpy: 150 } }) })
  })
}

function sellRequestCalls() {
  return (global.fetch as jest.Mock).mock.calls.filter(([url]) => String(url).includes('/api/lifai/sell-request'))
}

function depositStatusCalls() {
  return (global.fetch as jest.Mock).mock.calls.filter(([url]) => String(url).includes('/api/lifai/deposit-status'))
}

async function renderForm() {
  render(<LifaiSellRequestForm />)
  // マウント時の為替レート取得を act 内で完了させる
  await act(async () => {})
}

async function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Your USDT wallet address'), { target: { value: 'TWallet123' } })
  fireEvent.click(screen.getByLabelText('I reviewed the selected plan, fee, and estimated payout before submitting.'))
  fireEvent.click(screen.getByLabelText('I understand that I must send the exact EP amount to the LIFAI platform wallet after the request is confirmed.'))
  fireEvent.click(screen.getByLabelText('I confirm that the payout wallet belongs to me and can receive USDT on the selected network.'))
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Submit Sell Request' }))
  })
}

describe('LifaiSellRequestForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockReturnValue('tok-session-1')
    setupFetchMock()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('session_token と申請フィールドのみを送信する（source_wallet/platform_wallet なし）', async () => {
    await renderForm()
    await fillAndSubmit()

    const calls = sellRequestCalls()
    expect(calls).toHaveLength(1)
    const body = JSON.parse(calls[0][1].body)
    expect(body).toEqual({
      session_token: 'tok-session-1',
      lifai_plan: 'starter',
      ep_amount: 1000,
      payout_network: 'TRC20',
      payout_wallet: 'TWallet123',
    })
    expect(body).not.toHaveProperty('source_wallet')
    expect(body).not.toHaveProperty('platform_wallet')
  })

  it('成功時に申請後画面を表示し、即座に deposit-status を確認する', async () => {
    await renderForm()
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText(/Request ID: LIFAI-ABCDEF/)).toBeInTheDocument()
    })
    expect(screen.getByText('Waiting for EP deposit...')).toBeInTheDocument()

    const calls = depositStatusCalls()
    expect(calls.length).toBeGreaterThanOrEqual(1)
    const body = JSON.parse(calls[0][1].body)
    expect(body).toEqual({ session_token: 'tok-session-1', request_id: 'LIFAI-ABCDEF' })
  })

  it('OPEN_REQUEST_EXISTS の場合は専用メッセージを表示する', async () => {
    setupFetchMock({ sell: { ok: false, error: 'OPEN_REQUEST_EXISTS', open_request_id: 'LIFAI-OLD111' } })
    await renderForm()
    await fillAndSubmit()

    expect(screen.getByText('You already have an unfinished sell request.')).toBeInTheDocument()
    expect(screen.queryByText(/Request ID:/)).not.toBeInTheDocument()
  })

  it('insufficient の場合は受領額と不足額を表示する', async () => {
    setupFetchMock({
      deposit: { ok: true, state: 'insufficient', required_ep: 1000, received_ep: 300, shortfall_ep: 700, overpaid_ep: 0 },
    })
    await renderForm()
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText('Insufficient deposit: received 300 EP / 700 EP short.')).toBeInTheDocument()
    })
    expect(screen.queryByText('Waiting for EP deposit...')).not.toBeInTheDocument()
  })

  it('confirmed の場合は確認メッセージを表示し、過剰入金があれば overpaid も表示する', async () => {
    setupFetchMock({
      deposit: { ok: true, state: 'confirmed', required_ep: 1000, received_ep: 1050, shortfall_ep: 0, overpaid_ep: 50 },
    })
    await renderForm()
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText('EP deposit confirmed. USDT transfer will be initiated.')).toBeInTheDocument()
    })
    expect(screen.getByText('We received 50 EP more than requested.')).toBeInTheDocument()
  })

  it('confirmed で過剰入金が 0 の場合は overpaid を表示しない', async () => {
    setupFetchMock({
      deposit: { ok: true, state: 'confirmed', required_ep: 1000, received_ep: 1000, shortfall_ep: 0, overpaid_ep: 0 },
    })
    await renderForm()
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText('EP deposit confirmed. USDT transfer will be initiated.')).toBeInTheDocument()
    })
    expect(screen.queryByText(/EP more than requested/)).not.toBeInTheDocument()
  })

  it('confirmed 後はポーリングが停止する', async () => {
    jest.useFakeTimers()
    setupFetchMock({
      deposit: { ok: true, state: 'confirmed', required_ep: 1000, received_ep: 1000, shortfall_ep: 0, overpaid_ep: 0 },
    })
    await renderForm()
    await fillAndSubmit()

    // 即時チェック1回で confirmed → interval 側は最初の tick で停止
    await act(async () => {
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 5)
    })
    expect(depositStatusCalls().length).toBeLessThanOrEqual(2)
  })

  it('MAX_ATTEMPTS 経過でタイムアウト表示と再確認ボタンを出し、クリックでポーリングを再開する', async () => {
    jest.useFakeTimers()
    await renderForm()
    await fillAndSubmit()

    expect(screen.getByText('Waiting for EP deposit...')).toBeInTheDocument()

    await act(async () => {
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS * MAX_ATTEMPTS)
    })

    expect(screen.getByText('Deposit confirmation timed out.')).toBeInTheDocument()
    const recheckButton = screen.getByRole('button', { name: 'Check again' })
    expect(recheckButton).toBeInTheDocument()
    // 即時チェック1回 + interval 20回
    expect(depositStatusCalls()).toHaveLength(MAX_ATTEMPTS + 1)

    // 再確認ボタンでポーリング再開（waiting に戻り、即時チェックが走る）
    await act(async () => {
      fireEvent.click(recheckButton)
    })
    expect(screen.getByText('Waiting for EP deposit...')).toBeInTheDocument()
    expect(depositStatusCalls()).toHaveLength(MAX_ATTEMPTS + 2)

    // 再開後の interval も動作する
    await act(async () => {
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })
    expect(depositStatusCalls()).toHaveLength(MAX_ATTEMPTS + 3)
  })

  it('トークンが無い場合は submitError を表示し申請 API を呼ばない', async () => {
    mockGetToken.mockReturnValue(null)
    await renderForm()
    await fillAndSubmit()

    expect(screen.getByText('Submission failed. Please try again shortly.')).toBeInTheDocument()
    expect(sellRequestCalls()).toHaveLength(0)
    expect(depositStatusCalls()).toHaveLength(0)
  })

  it('チェック未確認の場合は confirmError を表示し送信しない', async () => {
    await renderForm()
    fireEvent.change(screen.getByLabelText('Your USDT wallet address'), { target: { value: 'TWallet123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Sell Request' }))

    expect(screen.getByText('You must confirm the plan and transfer acknowledgements before submitting.')).toBeInTheDocument()
    expect(sellRequestCalls()).toHaveLength(0)
  })
})
