import { render, screen } from '@testing-library/react'

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn().mockImplementation((namespace: string) => {
    const translations: Record<string, Record<string, string>> = {
      sidebar: {
        categoryTitle: 'Categories',
        searchTitle: 'Search Titles',
        searchPlaceholder: 'Enter game name',
        bannerSignupAlt: 'Sign up banner',
        bannerPcAlt: 'PC games banner',
        bannerMobileAlt: 'Mobile games banner',
      },
      category: {
        pc: 'PC Games',
        mobile: 'Mobile Games',
        other: 'Other',
      },
    }
    return Promise.resolve((key: string) => translations[namespace]?.[key] ?? key)
  }),
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

import Sidebar from '@/components/Sidebar'

describe('Sidebar', () => {
  it('renders category links', async () => {
    const sidebar = await Sidebar()
    render(sidebar)
    expect(screen.getByText(/PC Games/)).toBeInTheDocument()
    expect(screen.getByText(/Mobile Games/)).toBeInTheDocument()
    expect(screen.getByText(/Other/)).toBeInTheDocument()
  })

  it('renders the search input', async () => {
    const sidebar = await Sidebar()
    render(sidebar)
    expect(screen.getByPlaceholderText('Enter game name')).toBeInTheDocument()
  })

  it('renders side banners in the lower section', async () => {
    const sidebar = await Sidebar()
    render(sidebar)
    expect(screen.getByAltText('Sign up banner')).toBeInTheDocument()
    expect(screen.getByAltText('PC games banner')).toBeInTheDocument()
    expect(screen.getByAltText('Mobile games banner')).toBeInTheDocument()
  })
})
