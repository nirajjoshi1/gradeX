import { z } from 'zod'
import { ADToBS, BSToAD } from 'bikram-sambat-js'
import { HttpError } from '../../utils/http.js'

export const id = z.string().min(1)
export const decimal = z.coerce.number().min(0)
export const usernameSchema = z.string().trim().min(3).max(32).regex(/^[a-z0-9._-]+$/i, 'Username may only contain letters, numbers, dot, underscore, and dash')
export const dateTextSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')

export function getNameSuffix(index) {
  let suffix = ''
  let i = index
  while (i >= 0) {
    suffix = String.fromCharCode((i % 26) + 65) + suffix
    i = Math.floor(i / 26) - 1
  }
  return suffix
}

export function normalizeDob({ dobAd, dobBs }) {
  const nextDobAd = dobAd?.trim() || null
  const nextDobBs = dobBs?.trim() || null

  try {
    if (nextDobAd && !nextDobBs) {
      return { dobAd: nextDobAd, dobBs: ADToBS(nextDobAd) }
    }

    if (nextDobBs && !nextDobAd) {
      return { dobBs: nextDobBs, dobAd: BSToAD(nextDobBs) }
    }

    if (nextDobAd && nextDobBs) {
      return { dobAd: nextDobAd, dobBs: ADToBS(nextDobAd) }
    }
  } catch {
    throw new HttpError(400, 'Invalid DOB. Use valid AD or BS date in YYYY-MM-DD format')
  }

  return { dobAd: null, dobBs: null }
}
