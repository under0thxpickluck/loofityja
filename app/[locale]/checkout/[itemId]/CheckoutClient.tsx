'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { gasClient } from '@/lib/gas-client'
import { authStorage } from '@/lib/auth-storage'
import listingsData from '@/data/listings.json'
import { localizeListing } from '@/lib/catalog'
import { Listing } from '@/types'

export default function CheckoutClient({ itemId }: { itemId: string }) {
  const router = useRouter()
  const t = useTranslations('checkout')
  const { user, loading } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=/checkout/${itemId}`)
    }
  }, [itemId, loading, router, user])

  if (loading || !user) return null

  const rawListing = (listingsData as Listing[]).find((entry) => entry.id === Number(itemId))
  const listing = rawListing ? localizeListing(rawListing) : undefined
  if (!listing) {
    return <p className="p-8 text-gray-500">Item not found.</p>
  }

  async function handleContinue() {
    if (!listing) return
    setSubmitting(true)
    setError('')

    const token = authStorage.getToken() ?? ''

    try {
      const response = await gasClient.createPurchaseDraft(token, String(listing.id), listing.title, listing.price)
      if (response.ok && response.data) {
        router.push(response.data.payment_url)
      } else {
        setError(response.message || t('createDraftError'))
      }
    } catch {
      setError(t('unexpectedError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-8">
      <h1 className="mb-2 text-xl font-bold text-[#0b1929]">{t('title')}</h1>
      <p className="mb-6 text-sm text-gray-500">{t('subtitle')}</p>
      {error ? <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-gray-700">{t('itemDetails')}</h2>
            <div className="flex gap-4">
              <img src={listing.imageUrl} alt={listing.title} width={80} height={80} className="rounded object-cover" />
              <div>
                <p className="font-medium text-gray-800">{listing.title}</p>
                <p className="text-sm text-gray-500">{listing.gameName}</p>
                <p className="mt-1 text-sm text-gray-500">{t('delivery')}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
            <p>{t('digitalDelivery')}</p>
            <p>{t('paymentNote')}</p>
          </div>
        </div>
        <div className="self-start rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-gray-700">{t('orderSummary')}</h2>
          <div className="mb-1 flex justify-between text-sm">
            <span>{t('itemLabel')}</span>
            <span>JPY {listing.price.toLocaleString('ja-JP')}</span>
          </div>
          <div className="mb-4 flex justify-between text-sm text-gray-500">
            <span>{t('quantityLabel')}</span>
            <span>1</span>
          </div>
          <div className="mb-4 flex justify-between border-t border-gray-100 pt-3 font-bold text-[#0b1929]">
            <span>{t('totalLabel')}</span>
            <span>JPY {listing.price.toLocaleString('ja-JP')}</span>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            disabled={submitting}
            className="w-full rounded-lg bg-[#0b1929] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0d2038] disabled:opacity-50"
          >
            {submitting ? t('processing') : t('continue')}
          </button>
          <div className="mt-3 space-y-1 text-xs text-gray-400">
            <p>{t('badge1')}</p>
            <p>{t('badge2')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
