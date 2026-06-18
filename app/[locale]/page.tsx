// app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server'
import Carousel from '@/components/Carousel'
import GameRankingTable from '@/components/GameRankingTable'
import ListingCard from '@/components/ListingCard'
import Sidebar from '@/components/Sidebar'
import gamesData from '@/data/games.json'
import listingsData from '@/data/listings.json'
import { localizeGame, localizeListing } from '@/lib/catalog'
import { Game, Listing } from '@/types'

export default async function HomePage() {
  const t = await getTranslations('home')
  const games = (gamesData as Game[]).map(localizeGame)

  const pcGames = games
    .filter((g) => g.category === 'pc')
    .sort((a, b) => b.listingCount - a.listingCount)
    .slice(0, 5)

  const mobileGames = games
    .filter((g) => g.category === 'mobile')
    .sort((a, b) => b.listingCount - a.listingCount)
    .slice(0, 5)

  const recentListings = (listingsData.slice(0, 8) as Listing[]).map(localizeListing)
  const listingUnit = t('listingUnit')

  return (
    <>
      <Carousel />
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-700 mb-3">{t('rankingTitle')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <GameRankingTable games={mobileGames} title={t('mobileRanking')} listingUnit={listingUnit} />
              <GameRankingTable games={pcGames} title={t('pcRanking')} listingUnit={listingUnit} />
            </div>
            <h2 className="text-base font-bold text-gray-700 mb-3">{t('listingsTitle')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recentListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        </div>
      </div>
    </>
  )
}
