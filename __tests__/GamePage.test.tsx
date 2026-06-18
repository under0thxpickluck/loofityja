import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import GamePage from '@/app/[locale]/[category]/[slug]/page'

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn().mockResolvedValue(
    (key: string, params?: Record<string, string>) => {
      if (key === 'listingsTitle') return `Listings for ${params?.name ?? ''}`
      if (key === 'noListings') return 'No listings available'
      if (key === 'eyebrow') return 'LIFAI OTC'
      if (key === 'landingTitle') return 'Sell EP and settle in USDT'
      if (key === 'landingBody') return 'LIFAI body'
      if (key === 'cards.planTitle') return '1. Review the plan'
      if (key === 'cards.planBody') return 'Review body'
      if (key === 'cards.transferTitle') return '2. Send EP'
      if (key === 'cards.transferBody') return 'Transfer body'
      if (key === 'cards.payoutTitle') return '3. Receive USDT'
      if (key === 'cards.payoutBody') return 'Payout body'
      if (key === 'walletLabel') return 'Platform EP destination wallet'
      if (key === 'platformWallet') return 'LIFAI-EP-8842-1937-5521'
      if (key === 'walletHint') return 'Only transfer EP after your sell request is submitted.'
      if (key === 'startSellRequest') return 'Start EP Sell Request'
      if (key === 'acceptedNetworks') return 'Supported payout networks: TRC20, ERC20, BEP20'
      return key
    }
  ),
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

jest.mock('@/components/Sidebar', () => () => <div data-testid="sidebar" />)

jest.mock('@/components/GameListingList', () => ({
  __esModule: true,
  default: ({ listings }: { listings: { id: number }[] }) => (
    <div data-testid="game-listing-list">{listings.length} listings</div>
  ),
}))

const makeParams = (category: string, slug: string) =>
  Promise.resolve({ locale: 'en', category, slug })

describe('GamePage', () => {
  it('renders the game page for a valid game', async () => {
    render(await GamePage({ params: makeParams('pc', 'ffxiv') }))
    expect(screen.getByText('Listings for Final Fantasy XIV')).toBeInTheDocument()
    expect(screen.getByTestId('game-listing-list')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('shows noListings when there are no listings', async () => {
    render(await GamePage({ params: makeParams('pc', 'wow') }))
    expect(screen.getByText('No listings available')).toBeInTheDocument()
    expect(screen.queryByTestId('game-listing-list')).not.toBeInTheDocument()
  })

  it('renders the LIFAI sell request CTA instead of listings', async () => {
    render(await GamePage({ params: makeParams('pc', 'lifai') }))
    expect(screen.getByText('Sell EP and settle in USDT')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start EP Sell Request' })).toHaveAttribute('href', '/pc/lifai/sell')
    expect(screen.queryByTestId('game-listing-list')).not.toBeInTheDocument()
  })

  it('calls notFound for invalid category', async () => {
    await expect(
      GamePage({ params: makeParams('invalid', 'ffxiv') })
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('calls notFound for invalid slug', async () => {
    await expect(
      GamePage({ params: makeParams('pc', 'nonexistent-game') })
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('calls notFound for a slug in the wrong category', async () => {
    await expect(
      GamePage({ params: makeParams('mobile', 'ffxiv') })
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })
})
