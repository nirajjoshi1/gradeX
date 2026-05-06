import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function syncDobFromAd(setForms, forms, dobAd, ADToBS) {
  setForms({ ...forms, dobAd, dobBs: ADToBS(dobAd) })
}

export function syncDobFromBs(setForms, forms, dobBs, BSToAD) {
  if (dobBs.length === 10) {
    setForms({ ...forms, dobBs, dobAd: BSToAD(dobBs) })
  } else {
    setForms({ ...forms, dobBs })
  }
}
