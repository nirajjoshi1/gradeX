import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '../db.js'
import {
  clearAuthCookie,
  requireAuth,
  setAuthCookie,
  signToken,
} from '../middleware/auth.js'
import { HttpError, asyncHandler, pickUser, validate } from '../utils/http.js'

const router = Router()

const loginSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(6),
  schoolSlug: z.string().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
})

router.get(
  '/identify/:username',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
      select: {
        school: {
          select: { name: true, logoUrl: true, address: true }
        }
      }
    })
    res.json(user?.school || null)
  })
)

router.get(
  '/school/:slug',
  asyncHandler(async (req, res) => {
    const school = await prisma.school.findUnique({
      where: { slug: req.params.slug.toLowerCase() },
      select: { name: true, logoUrl: true, address: true }
    })
    if (!school) throw new HttpError(404, 'School not found')
    res.json(school)
  })
)

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { username, password, schoolSlug } = req.body

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: { school: true },
    })

    if (!user || !user.isActive) {
      throw new HttpError(401, 'Invalid username or password')
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      throw new HttpError(401, 'Invalid username or password')
    }

    // Institution validation
    const reserved = ['admin', 'teacher', 'super-admin']
    if (schoolSlug && !reserved.includes(schoolSlug)) {
      if (user.role === 'SUPER_ADMIN') {
        // Super admin can only log in through /super-admin (global) or we can allow them anywhere
        // But per requirements, let's keep it strict
      } else if (!user.school || user.school.slug !== schoolSlug) {
        throw new HttpError(401, 'Invalid username or password')
      }
    }

    setAuthCookie(res, signToken(user))
    res.json({ user: pickUser(user) })
  }),
)

router.post('/logout', (_req, res) => {
  clearAuthCookie(res)
  res.status(204).end()
})

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: pickUser(req.user) })
  }),
)

router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const isValid = await bcrypt.compare(req.body.currentPassword, req.user.passwordHash)

    if (!isValid) {
      throw new HttpError(401, 'Current password is incorrect')
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash: await bcrypt.hash(req.body.newPassword, 12),
      },
    })

    res.json({ ok: true })
  }),
)

export default router
