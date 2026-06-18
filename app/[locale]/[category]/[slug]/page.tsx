import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Sidebar from '@/components/Sidebar'
import GameListingList from '@/components/GameListingList'
import { Link } from '@/i18n/navigation'
import gamesData from '@/data/games.json'
import listingsData from '@/data/listings.json'
import { localizeGame, localizeListing } from '@/lib/catalog'
import { gasClient } from '@/lib/gas-client'
import { getLifaiWalletSlot } from '@/lib/lifai'
import { Game, Listing } from '@/types'

const VALID_CATEGORIES = ['pc', 'mobile', 'other'] as const

export default async function GamePage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>
}) {
  const { category, slug } = await params

  if (!(VALID_CATEGORIES as readonly string[]).includes(category)) {
    notFound()
  }

  const game = (gamesData as Game[]).map(localizeGame).find(
    (g) => g.slug === slug && g.category === category
  )
  if (!game) {
    notFound()
  }

  const listings = (listingsData as Listing[]).filter(
    (l) => l.gameId === game.id
  ).map(localizeListing)

  const t = await getTranslations('game')
  const tLifai = await getTranslations('lifai')
  const isLifai = game.slug === 'lifai'
  let currentLifaiWallet: string | null = null

  if (isLifai) {
    const walletResult = await gasClient.getLifaiWallets()
    if (walletResult.ok && walletResult.data && walletResult.data.wallets.length > 0) {
      currentLifaiWallet = getLifaiWalletSlot(walletResult.data.wallets).wallet_address
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-800 mb-6">
            {t('listingsTitle', { name: game.name })}
          </h1>
          {isLifai ? (
            <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">{tLifai('eyebrow')}</p>
                <h2 className="mt-2 text-2xl font-bold text-[#0b1929]">{tLifai('landingTitle')}</h2>
                <p className="mt-3 max-w-3xl text-sm text-gray-600">{tLifai('landingBody')}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-900">{tLifai('cards.planTitle')}</p>
                  <p className="mt-2">{tLifai('cards.planBody')}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-900">{tLifai('cards.transferTitle')}</p>
                  <p className="mt-2">{tLifai('cards.transferBody')}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-900">{tLifai('cards.payoutTitle')}</p>
                  <p className="mt-2">{tLifai('cards.payoutBody')}</p>
                </div>
              </div>

              <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
                <p className="text-sm font-semibold text-sky-900">{tLifai('walletSectionTitle')}</p>
                {currentLifaiWallet ? (
                  <p className="mt-2 break-all font-mono text-sm text-sky-800">{currentLifaiWallet}</p>
                ) : null}
                <p className="mt-3 text-xs text-sky-700">{tLifai('walletHint')}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/pc/lifai/sell" className="rounded-lg bg-[#0b1929] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0d2038]">
                  {tLifai('startSellRequest')}
                </Link>
                <span className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-600">
                  {tLifai('acceptedNetworks')}
                </span>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('noListings')}</p>
          ) : (
            <GameListingList listings={listings} />
          )}
        </div>
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      </div>
    </div>
  )
}
