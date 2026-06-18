import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn().mockResolvedValue((key: string) => {
    const en: Record<string, string> = {
      search: 'Search game titles',
      login: 'Login',
      register: 'Sign Up',
      'nav.pc': 'PC Games',
      'nav.mobile': 'Mobile Games',
      'nav.other': 'Other',
      'nav.all': 'All Titles',
    }
    return en[key] ?? key
  }),
}))

jest.mock('@/components/LanguageSwitcher', () => ({
  __esModule: true,
  default: () => <div data-testid="language-switcher" />,
}))

jest.mock('@/components/UserMenu', () => ({
  __esModule: true,
  default: () => <div data-testid="user-menu" />,
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

import Header from '@/components/Header'

describe('Header', () => {
  it('renders logo', async () => {
    const header = await Header()
    render(
      <NextIntlClientProvider locale="en" messages={{}}>
        {header}
      </NextIntlClientProvider>
    )
    expect(screen.getByAltText('RMTsite')).toBeInTheDocument()
  })

  it('renders search bar', async () => {
    const header = await Header()
    render(
      <NextIntlClientProvider locale="en" messages={{}}>
        {header}
      </NextIntlClientProvider>
    )
    expect(screen.getByPlaceholderText('Search game titles')).toBeInTheDocument()
  })

  it('renders user menu', async () => {
    const header = await Header()
    render(
      <NextIntlClientProvider locale="en" messages={{}}>
        {header}
      </NextIntlClientProvider>
    )
    expect(screen.getByTestId('user-menu')).toBeInTheDocument()
  })

  it('renders language switcher', async () => {
    const header = await Header()
    render(
      <NextIntlClientProvider locale="en" messages={{}}>
        {header}
      </NextIntlClientProvider>
    )
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument()
  })
})
