import { render, screen } from '@testing-library/react'
import MockPaymentPage from '@/app/[locale]/payment/mock/page'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      title: 'Payment Gateway Not Yet Live',
      line1: 'Your checkout session has been created successfully.',
      line2: 'The payment gateway is currently in test mode and has not been enabled yet.',
      line3: 'This flow is ready for future live payment integration.',
      tokenLabel: 'Checkout Token',
      statusLabel: 'Payment Status',
      statusValue: 'Disabled / Test Mode',
      home: 'Return to Home',
      profile: 'Go to My Purchases',
    }
    return messages[key] ?? key
  },
}))

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (key: string) => (key === 'token' ? 'CHK_ABC123' : null) }),
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

describe('MockPaymentPage', () => {
  it('shows the payment disabled message', () => {
    render(<MockPaymentPage />)
    expect(screen.getByText('Payment Gateway Not Yet Live')).toBeInTheDocument()
  })

  it('shows the checkout token', () => {
    render(<MockPaymentPage />)
    expect(screen.getByText('CHK_ABC123')).toBeInTheDocument()
  })

  it('renders the return home link', () => {
    render(<MockPaymentPage />)
    expect(screen.getByRole('link', { name: 'Return to Home' })).toBeInTheDocument()
  })
})
