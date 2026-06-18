import { Listing } from '@/types'

type Props = {
  listings: Listing[]
}

const currencyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
})

export default function GameListingList({ listings }: Props) {
  return (
    <div className="divide-y divide-gray-100 rounded border border-gray-200">
      {listings.map((listing) => (
        <div key={listing.id} className="flex items-center gap-3 px-4 py-3">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            width={60}
            height={60}
            className="shrink-0 rounded object-cover"
          />
          <a href={`/item/${listing.id}`} className="min-w-0 flex-1 truncate text-sm text-sky-500 hover:underline">
            {listing.title}
          </a>
          <span className="shrink-0 whitespace-nowrap text-sm font-bold text-red-600">
            {currencyFormatter.format(listing.price)}
          </span>
        </div>
      ))}
    </div>
  )
}
