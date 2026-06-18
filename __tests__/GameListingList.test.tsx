import { render, screen } from '@testing-library/react'
import GameListingList from '@/components/GameListingList'
import { Listing } from '@/types'

const mockListings: Listing[] = [
  { id: 1, gameId: 1, gameName: 'Test Game', title: 'Test Listing A', price: 3500, imageUrl: '/images/placeholder.svg' },
  { id: 2, gameId: 1, gameName: 'Test Game', title: 'Test Listing B', price: 12000, imageUrl: '/images/placeholder.svg' },
]

describe('GameListingList', () => {
  it('renders listing titles', () => {
    render(<GameListingList listings={mockListings} />)
    expect(screen.getByText('Test Listing A')).toBeInTheDocument()
    expect(screen.getByText('Test Listing B')).toBeInTheDocument()
  })

  it('renders prices', () => {
    render(<GameListingList listings={mockListings} />)
    expect(screen.getByText('¥3,500')).toBeInTheDocument()
    expect(screen.getByText('¥12,000')).toBeInTheDocument()
  })

  it('links to item detail pages', () => {
    render(<GameListingList listings={mockListings} />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '/item/1')
    expect(links[1]).toHaveAttribute('href', '/item/2')
  })

  it('renders images', () => {
    render(<GameListingList listings={mockListings} />)
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
  })

  it('renders nothing interactive for an empty list', () => {
    render(<GameListingList listings={[]} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
