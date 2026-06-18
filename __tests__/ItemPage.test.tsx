import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import ItemPage from '@/app/[locale]/item/[id]/page'

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
}))

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn().mockResolvedValue((key: string) => {
    const messages: Record<string, string> = {
      gameLabel: 'Game',
      categoryLabel: 'Category',
      deliveryLabel: 'Delivery',
      availabilityLabel: 'Availability',
      digitalGoods: 'Digital Goods',
      deliveryValue: 'Within 24 hours',
      availabilityValue: 'In Stock',
      sellerLabel: 'Seller',
      sellerValue: 'Verified Seller | 100% positive feedback',
      priceNote: 'Fixed price | No hidden fees',
      buyNow: 'Buy Now',
      badge1: 'Secure Checkout',
      badge2: 'Trusted Marketplace',
      badge3: 'Protected Purchase Flow',
    }
    return messages[key] ?? key
  }),
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

const makeParams = (id: string) => Promise.resolve({ locale: 'en', id })

describe('ItemPage', () => {
  it('renders the matching listing', async () => {
    render(await ItemPage({ params: makeParams('1') }))
    expect(screen.getByRole('link', { name: /Buy Now/i })).toBeInTheDocument()
  })

  it('calls notFound for unknown ids', async () => {
    await expect(ItemPage({ params: makeParams('99999') })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })
})
