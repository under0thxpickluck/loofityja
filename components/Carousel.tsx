'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useRef } from 'react'
import { useTranslations } from 'next-intl'

export default function Carousel() {
  const t = useTranslations('carousel')
  const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: false }))
  const [emblaRef] = useEmblaCarousel({ loop: true }, [autoplay.current])

  const BANNERS = [1, 2, 3, 4, 5, 6, 7, 8]

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {BANNERS.map((id) => (
          <div key={id} className="flex-none w-full">
            <img
              src={`/images/バナー/${id}.png`}
              alt={t('slide' + (((id - 1) % 3) + 1))}
              className="w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
