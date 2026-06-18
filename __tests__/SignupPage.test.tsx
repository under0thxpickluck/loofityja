import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mockPush = jest.fn()
const mockSignup = jest.fn()

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      title: 'Create your account',
      subtitle: 'Sign up to start checkout and manage your Lootify profile.',
      firstName: 'First name',
      lastName: 'Last name',
      displayName: 'Display name',
      email: 'Email address',
      password: 'Password',
      country: 'Country',
      phone: 'Phone number',
      marketing: 'Receive occasional marketplace updates.',
      submit: 'Create Account',
      submitting: 'Creating account...',
      haveAccount: 'Already registered?',
      signin: 'Sign in',
    }
    return messages[key] ?? key
  },
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/lib/gas-client', () => ({
  gasClient: {
    signup: (...args: unknown[]) => mockSignup(...args),
  },
}))

import SignupPage from '@/app/[locale]/signup/page'

describe('SignupPage', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockSignup.mockReset()
  })

  it('submits signup and redirects to verify page', async () => {
    mockSignup.mockResolvedValue({ ok: true, code: 'SUCCESS', message: 'ok' })
    render(<SignupPage />)
    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'Taro' } })
    fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: 'Yamada' } })
    fireEvent.change(screen.getByPlaceholderText('Display name'), { target: { value: 'Taro' } })
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret' } })
    fireEvent.change(screen.getByPlaceholderText('Country'), { target: { value: 'JP' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Create Account' }).closest('form')!)
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/verify-email?email=a%40b.com')
    })
  })
})
