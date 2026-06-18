import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mockPush = jest.fn()
const mockLogout = jest.fn()
const mockUseAuth = jest.fn()

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      loading: 'Loading...',
      login: 'Login',
      signup: 'Sign Up',
      settings: 'Settings',
      logout: 'Logout',
      signingOut: 'Signing out...',
    }
    return messages[key] ?? key
  },
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

import UserMenu from '@/components/UserMenu'

describe('UserMenu', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockLogout.mockReset()
  })

  it('logged out state shows login links', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, logout: mockLogout })
    render(<UserMenu />)
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('logged in state shows user links', () => {
    mockUseAuth.mockReturnValue({
      user: { display_name: 'Taro' },
      loading: false,
      logout: mockLogout,
    })
    render(<UserMenu />)
    expect(screen.getByText('Taro')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('logout clears session through context action', async () => {
    mockLogout.mockResolvedValue(undefined)
    mockUseAuth.mockReturnValue({
      user: { display_name: 'Taro' },
      loading: false,
      logout: mockLogout,
    })
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })
})
