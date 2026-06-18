import { render, screen } from '@testing-library/react'

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn().mockResolvedValue((key: string) => {
    const en: Record<string, string> = {
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      contact: 'Contact Us',
      guide: 'User Guide',
    }
    return en[key] ?? key
  }),
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

import Footer from '@/components/Footer'

describe('Footer', () => {
  it('Terms of Service リンクを表示する', async () => {
    const footer = await Footer()
    render(footer)
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
  })

  it('Privacy Policy リンクを表示する', async () => {
    const footer = await Footer()
    render(footer)
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  })

  it('コピーライトを表示する', async () => {
    const footer = await Footer()
    render(footer)
    expect(screen.getByText(/RMTsite/)).toBeInTheDocument()
  })
})
