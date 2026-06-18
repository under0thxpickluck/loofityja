import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CheckoutPage from '@/app/[locale]/checkout/[itemId]/page'

const mockPush = jest.fn()
const mockCreateDraft = jest.fn()
const mockUseAuth = jest.fn()

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      title: 'Secure Checkout',
      subtitle: 'Review your item details before continuing.',
      createDraftError: 'Unable to create checkout session.',
      unexpectedError: 'Something went wrong. Please try again.',
      itemDetails: 'Item Details',
      delivery: 'Delivery: within 24 hours',
      digitalDelivery: 'Digital delivery, no shipping required.',
      paymentNote: 'Your payment will not be processed until you proceed.',
      orderSummary: 'Order Summary',
      itemLabel: 'Item',
      quantityLabel: 'Quantity',
      totalLabel: 'Total',
      continue: 'Continue to Payment',
      processing: 'Processing...',
      badge1: 'Secure Checkout',
      badge2: 'Protected Purchase Flow',
    }
    return messages[key] ?? key
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/lib/gas-client', () => ({
  gasClient: {
    createPurchaseDraft: (...args: unknown[]) => mockCreateDraft(...args),
  },
}))

jest.mock('@/lib/auth-storage', () => ({
  authStorage: {
    getToken: () => 'tok_test',
  },
}))

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const makeParams = (itemId: string) => Promise.resolve({ locale: 'en', itemId })

describe('CheckoutPage', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockCreateDraft.mockReset()
    mockUseAuth.mockReset()
  })

  it('redirects unauthenticated users to login', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    render(await CheckoutPage({ params: makeParams('1') }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login?redirect=/checkout/1'))
  })

  it('shows item details for authenticated users', async () => {
    mockUseAuth.mockReturnValue({
      user: { user_id: 'USR_000001', display_name: 'Taro', email: 'a@b.com', full_name: 'Taro Y', avatar_url: '', country: 'JP', account_status: 'active', email_verified: 'true' },
      loading: false,
    })
    render(await CheckoutPage({ params: makeParams('1') }))
    expect(screen.getByRole('heading', { name: 'Secure Checkout' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue to Payment' })).toBeInTheDocument()
  })

  it('creates purchase draft and navigates to payment page', async () => {
    mockUseAuth.mockReturnValue({
      user: { user_id: 'USR_000001', display_name: 'Taro', email: 'a@b.com', full_name: 'Taro Y', avatar_url: '', country: 'JP', account_status: 'active', email_verified: 'true' },
      loading: false,
    })
    mockCreateDraft.mockResolvedValue({
      ok: true,
      code: 'PURCHASE_DRAFT_CREATED',
      message: 'ok',
      data: { draft_id: 'DRF_000001', checkout_token: 'CHK_ABC123', payment_url: '/payment/mock?token=CHK_ABC123' },
    })
    render(await CheckoutPage({ params: makeParams('1') }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Payment' }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/payment/mock?token=CHK_ABC123'))
  })
})
