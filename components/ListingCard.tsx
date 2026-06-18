import Link from 'next/link'
import Image from 'next/image'

type Listing = {
  id: number
  gameId: number
  gameName: string
  title: string
  price: number
  imageUrl: string
}

type Props = {
  listing: Listing
}

const currencyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
})

export default function ListingCard({ listing }: Props) {
  return (
    <Link
      href={`/item/${listing.id}`}
      className="block rounded border border-gray-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative h-32 w-full bg-sky-50">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          className="rounded-t object-cover"
        />
      </div>
      <div className="p-3">
        <p className="mb-1 text-xs text-gray-500">{listing.gameName}</p>
        <p className="line-clamp-2 text-sm font-medium text-gray-800">{listing.title}</p>
        <p className="mt-2 font-bold text-sky-500">
          {currencyFormatter.format(listing.price)}
        </p>
      </div>
    </Link>
  )
}
