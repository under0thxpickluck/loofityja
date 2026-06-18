// app/[locale]/category/page.tsx
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Sidebar from '@/components/Sidebar'
import gamesData from '@/data/games.json'
import { localizeGame } from '@/lib/catalog'
import { Game } from '@/types'

export default async function CategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>
}) {
  const t = await getTranslations('category')
  const params = await searchParams
  const rawType = Array.isArray(params.type) ? params.type[0] : params.type
  const activeType = rawType && ['pc', 'mobile', 'other'].includes(rawType) ? rawType : undefined

  const CATEGORY_LABELS: Record<string, string> = {
    pc: t('pc'),
    mobile: t('mobile'),
    other: t('other'),
  }

  const categories = activeType ? [activeType] : ['pc', 'mobile', 'other']
  const allGames = (gamesData as Game[]).map(localizeGame)
  const filteredGames = activeType
    ? allGames.filter((g) => g.category === activeType)
    : allGames

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-800 mb-6">{t('title')}</h1>
          {categories.map((cat) => {
            const games = filteredGames.filter((g) => g.category === cat)
            if (games.length === 0) return null
            return (
              <div key={cat} className="mb-8">
                <h2 className="text-sm font-bold text-sky-500 border-b border-sky-200 pb-1 mb-3">
                  {CATEGORY_LABELS[cat] ?? cat}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {games.map((game) => (
                    <Link
                      key={game.id}
                      href={`/${game.category}/${game.slug}`}
                      className="block bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded px-3 py-2 text-sm text-center text-sky-700 hover:text-sky-900 transition-colors"
                    >
                      {game.name}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      </div>
    </div>
  )
}
