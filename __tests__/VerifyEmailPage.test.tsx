import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mockPush = jest.fn()
const mockVerifyEmail = jest.fn()
const mockResend = jest.fn()

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    const messages: Record<string, string> = {
      title: 'Verify your email',
      subtitle: `Enter the 6-digit code sent to ${values?.email ?? 'your inbox'}.`,
      fallbackInbox: 'your inbox',
      code: 'Verification code',
      submit: 'Verify Email',
      verifying: 'Verifying...',
      resend: 'Resend Code',
      sending: 'Sending...',
      resendSuccess: 'A new verification code has been sent.',
      back: 'Return to login',
    }
    return messages[key] ?? key
  },
}))

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (key: string) => (key === 'email' ? 'a@b.com' : null) }),
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/lib/gas-client', () => ({
  gasClient: {
    verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
    resendVerifyCode: (...args: unknown[]) => mockResend(...args),
  },
}))

import VerifyEmailPage from '@/app/[locale]/verify-email/page'

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockVerifyEmail.mockReset()
    mockResend.mockReset()
  })

  it('verifies code and redirects to login', async () => {
    mockVerifyEmail.mockResolvedValue({ ok: true, code: 'SUCCESS', message: 'ok' })
    render(<VerifyEmailPage />)
    fireEvent.change(screen.getByPlaceholderText('Verification code'), { target: { value: '123456' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Verify Email' }).closest('form')!)
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login?verified=1&email=a%40b.com'))
  })

  it('resends code', async () => {
    mockResend.mockResolvedValue({ ok: true, code: 'SUCCESS', message: 'ok' })
    render(<VerifyEmailPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Resend Code' }))
    await waitFor(() => expect(mockResend).toHaveBeenCalledWith('a@b.com'))
  })
})
