import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function Sidebar() {
  const tSidebar = await getTranslations('sidebar')
  const tCategory = await getTranslations('category')
  const sideBanners = [
    { src: '/images/サイドバナー/1.png', href: '/signup', alt: tSidebar('bannerSignupAlt') },
    { src: '/images/サイドバナー/2.png', href: '/category?type=pc', alt: tSidebar('bannerPcAlt') },
    { src: '/images/サイドバナー/3.png', href: '/category?type=mobile', alt: tSidebar('bannerMobileAlt') },
  ]

  return (
    <aside className="w-48 shrink-0">
      <div className="mb-4 rounded border border-gray-200 bg-gray-50 p-3">
        <h3 className="mb-2 text-sm font-bold text-gray-700">{tSidebar('categoryTitle')}</h3>
        <ul className="space-y-1 text-sm">
          <li>
            <Link href="/category?type=pc" className="flex items-center gap-1 text-sky-500 hover:underline">
              <span aria-hidden="true">›</span> {tCategory('pc')}
            </Link>
          </li>
          <li>
            <Link href="/category?type=mobile" className="flex items-center gap-1 text-sky-500 hover:underline">
              <span aria-hidden="true">›</span> {tCategory('mobile')}
            </Link>
          </li>
          <li>
            <Link href="/category?type=other" className="flex items-center gap-1 text-sky-500 hover:underline">
              <span aria-hidden="true">›</span> {tCategory('other')}
            </Link>
          </li>
        </ul>
      </div>
      <div className="rounded border border-gray-200 bg-gray-50 p-3">
        <h3 className="mb-2 text-sm font-bold text-gray-700">{tSidebar('searchTitle')}</h3>
        <input
          type="text"
          placeholder={tSidebar('searchPlaceholder')}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500"
        />
      </div>
      <div className="mt-4 space-y-3">
        {sideBanners.map((banner) => (
          <Link
            key={banner.src}
            href={banner.href}
            className="block overflow-hidden rounded border border-gray-200 bg-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
          >
            <img src={banner.src} alt={banner.alt} className="block h-auto w-full" />
          </Link>
        ))}
      </div>
    </aside>
  )
}
