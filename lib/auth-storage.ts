import { User } from '@/types'

const TOKEN_KEY = 'lootify.session_token'
const USER_KEY = 'lootify.user'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function parseUser(raw: string | null): User | null {
  if (!raw) return null

  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export const authStorage = {
  getToken() {
    if (!canUseStorage()) return null
    return window.localStorage.getItem(TOKEN_KEY)
  },
  setToken(token: string) {
    if (!canUseStorage()) return
    window.localStorage.setItem(TOKEN_KEY, token)
  },
  clearToken() {
    if (!canUseStorage()) return
    window.localStorage.removeItem(TOKEN_KEY)
  },
  getUser() {
    if (!canUseStorage()) return null
    return parseUser(window.localStorage.getItem(USER_KEY))
  },
  setUser(user: User) {
    if (!canUseStorage()) return
    window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clearUser() {
    if (!canUseStorage()) return
    window.localStorage.removeItem(USER_KEY)
  },
  clearSession() {
    this.clearToken()
    this.clearUser()
  },
}
