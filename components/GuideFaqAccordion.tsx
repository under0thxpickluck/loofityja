'use client'

import { useState } from 'react'

type FaqItem = { q: string; a: string }

export default function GuideFaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white">
          <button
            className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-[#0b1929]"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span>{item.q}</span>
            <span className="ml-4 flex-shrink-0 text-gray-400 text-lg leading-none">
              {open === i ? '−' : '+'}
            </span>
          </button>
          {open === i && (
            <div className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
