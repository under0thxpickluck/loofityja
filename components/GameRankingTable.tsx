import { Link } from '@/i18n/navigation'
import { Game } from '@/types'

type Props = {
  games: Game[]
  title: string
  listingUnit: string
}

const rankIcons: Record<number, string> = {
  0: '/images/ランキング用アイコン/1.png',
  1: '/images/ランキング用アイコン/2.png',
  2: '/images/ランキング用アイコン/3.png',
}

export default function GameRankingTable({ games, title, listingUnit }: Props) {
  return (
    <div className="rounded border border-gray-200 bg-white">
      <div className="rounded-t bg-[#0b1929] px-4 py-2 text-sm font-bold text-white">
        {title}
      </div>
      <table className="w-full text-sm">
        <tbody>
          {games.map((game, index) => (
            <tr key={game.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="w-8 px-3 py-2 text-gray-500">
                {index < 3 ? (
                  <img src={rankIcons[index]} alt={`Rank ${index + 1}`} width={24} height={24} />
                ) : (
                  index + 1
                )}
              </td>
              <td className="px-3 py-2">
                <Link href={`/${game.category}/${game.slug}`} className="text-sky-500 hover:underline">
                  {game.name}
                </Link>
              </td>
              <td className="px-3 py-2 text-right text-gray-500">
                {game.listingCount.toLocaleString('en-US')} {listingUnit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
