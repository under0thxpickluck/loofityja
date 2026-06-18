'use client'

import type { Metadata } from 'next'
import { FormEvent, useState } from 'react'
import { useRouter } from '@/i18n/navigation'

export default function PortalLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(false)
    setLoading(true)
    try {
      const res = await fetch('/api/portal/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/portal/m3k7x9/manual')
      } else {
        setError(true)
        setPassword('')
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b1929]">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">アクセス制限</h1>
          <p className="mt-1 text-sm text-gray-500">このページを閲覧するにはパスワードが必要です。</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="portal-pw" className="mb-1 block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <input
                id="portal-pw"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#0b1929] focus:ring-1 focus:ring-[#0b1929]"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                パスワードが正しくありません。
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-lg bg-[#0b1929] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0d2038] disabled:opacity-50"
            >
              {loading ? '確認中...' : '入室する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
