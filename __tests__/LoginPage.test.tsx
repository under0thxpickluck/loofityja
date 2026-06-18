import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mockPush = jest.fn()
const mockLogin = jest.fn()

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      title: 'Sign in',
      subtitle: 'Access your Lootify account to continue checkout.',
      verified: 'Your email has been verified. Please sign in.',
      email: 'Email address',
      password: 'Password',
      submit: 'Login',
      submitting: 'Signing in...',
      needAccount: 'Need an account?',
      createOne: 'Create one',
    }
    return messages[key] ?? key
  },
}))

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'redirect') return '/checkout/1'
      if (key === 'email') return 'a@b.com'
      return null
    },
  }),
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: (...args: unknown[]) => mockLogin(...args),
  }),
}))

import LoginPage from '@/app/[locale]/login/page'

describe('LoginPage', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockLogin.mockReset()
  })

  it('logs in and redirects to requested page', async () => {
    mockLogin.mockResolvedValue({ ok: true, code: 'SUCCESS', message: 'ok' })
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Login' }).closest('form')!)
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/checkout/1'))
  })

  it('redirects to verify email when verification is required', async () => {
    mockLogin.mockResolvedValue({ ok: false, code: 'VERIFY_REQUIRED', message: 'verify' })
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Login' }).closest('form')!)
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/verify-email?email=a%40b.com'))
  })
})
