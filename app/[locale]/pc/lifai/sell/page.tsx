'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from '@/i18n/navigation'
import LifaiSellRequestForm from '@/components/LifaiSellRequestForm'

export default function LifaiSellPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [loading, user, router, pathname])

  if (loading || !user) {
    return null
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <LifaiSellRequestForm />
    </div>
  )
}
