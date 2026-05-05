import { create } from 'zustand'

import { api } from '@/lib/api'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  async loadMe() {
    try {
      const data = await api('/auth/me')
      set({ user: data.user, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },
  async login(credentials) {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    set({ user: data.user })
    return data.user
  },
  async logout() {
    await api('/auth/logout', { method: 'POST' })
    set({ user: null })
  },
}))
