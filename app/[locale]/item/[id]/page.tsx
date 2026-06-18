import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import listingsData from '@/data/listings.json'
import { localizeListing } from '@/lib/catalog'
import { Listing } from '@/types'

export default async function ItemPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params
  const t = await getTranslations('item')
  const rawListing = (listingsData as Listing[]).find((entry) => entry.id === Number(id))
  const listing = rawListing ? localizeListing(rawListing) : undefined

  if (!listing) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-gray-100">
            <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-900">{listing.title}</h1>
          <p className="mb-4 text-sm text-gray-500">
            {t('gameLabel')}: <span className="font-medium text-gray-700">{listing.gameName}</span>
          </p>
          <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <p><span className="font-medium">{t('categoryLabel')}:</span> {t('digitalGoods')}</p>
            <p><span className="font-medium">{t('deliveryLabel')}:</span> {t('deliveryValue')}</p>
            <p><span className="font-medium">{t('availabilityLabel')}:</span> {t('availabilityValue')}</p>
          </div>
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="mb-1 font-medium text-gray-700">{t('sellerLabel')}</p>
            <p className="text-gray-500">{t('sellerValue')}</p>
          </div>
        </div>
        <div>
          <div className="sticky top-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="mb-1 text-3xl font-bold text-[#0b1929]">
              ¥{listing.price.toLocaleString('ja-JP')}
            </p>
            <p className="mb-6 text-sm text-gray-500">{t('priceNote')}</p>
            <Link
              href={`/checkout/${listing.id}`}
              className="block w-full rounded-lg bg-[#0b1929] py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#0d2038]"
            >
              {t('buyNow')} | ¥{listing.price.toLocaleString('ja-JP')}
            </Link>
            <div className="mt-4 space-y-2 text-xs text-gray-500">
              <p>{t('badge1')}</p>
              <p>{t('badge2')}</p>
              <p>{t('badge3')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
