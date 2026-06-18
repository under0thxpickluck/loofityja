import { render, screen } from '@testing-library/react'
import ListingCard from '@/components/ListingCard'

const mockListing = {
  id: 1,
  gameId: 1,
  gameName: 'FFXIV',
  title: 'Gil 100',
  price: 3500,
  imageUrl: '/images/placeholder.svg',
}

describe('ListingCard', () => {
  it('renders title', () => {
    render(<ListingCard listing={mockListing} />)
    expect(screen.getByText('Gil 100')).toBeInTheDocument()
  })

  it('renders price', () => {
    render(<ListingCard listing={mockListing} />)
    expect(screen.getByText('¥3,500')).toBeInTheDocument()
  })

  it('renders game name', () => {
    render(<ListingCard listing={mockListing} />)
    expect(screen.getByText('FFXIV')).toBeInTheDocument()
  })

  it('links to item detail page', () => {
    render(<ListingCard listing={mockListing} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/item/1')
  })
})
