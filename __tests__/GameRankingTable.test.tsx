import { render, screen } from '@testing-library/react'
import GameRankingTable from '@/components/GameRankingTable'

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

const mockGames = [
  { id: 1, name: 'Game A', slug: 'game-a', category: 'pc' as const, listingCount: 100000 },
  { id: 2, name: 'Game B', slug: 'game-b', category: 'mobile' as const, listingCount: 200000 },
]

describe('GameRankingTable', () => {
  it('renders title', () => {
    render(<GameRankingTable games={mockGames} title="Mobile Games Ranking" listingUnit="listings" />)
    expect(screen.getByText('Mobile Games Ranking')).toBeInTheDocument()
  })

  it('renders game names', () => {
    render(<GameRankingTable games={mockGames} title="Ranking" listingUnit="listings" />)
    expect(screen.getByText('Game A')).toBeInTheDocument()
    expect(screen.getByText('Game B')).toBeInTheDocument()
  })

  it('renders listing counts', () => {
    render(<GameRankingTable games={mockGames} title="Ranking" listingUnit="listings" />)
    expect(screen.getByText('100,000 listings')).toBeInTheDocument()
    expect(screen.getByText('200,000 listings')).toBeInTheDocument()
  })

  it('uses [category]/[slug] links', () => {
    render(<GameRankingTable games={mockGames} title="Ranking" listingUnit="listings" />)
    const linkA = screen.getByRole('link', { name: 'Game A' })
    const linkB = screen.getByRole('link', { name: 'Game B' })
    expect(linkA).toHaveAttribute('href', '/pc/game-a')
    expect(linkB).toHaveAttribute('href', '/mobile/game-b')
  })
})
