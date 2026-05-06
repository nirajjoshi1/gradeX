import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler, validate } from '../utils/http.js'

const router = Router()

router.use(requireAuth, requireRole('ADMIN'))

// Get current school settings
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const school = await prisma.school.findUnique({
      where: { id: req.user.schoolId },
    })
    res.json(school)
  }),
)

// Update school settings
router.patch(
  '/',
  validate(
    z.object({
      name: z.string().min(1).optional(),
      address: z.string().optional(),
      phone: z.string().optional().nullable(),
      email: z.string().email().optional().nullable().or(z.literal('')),
      website: z.string().optional().nullable(),
      logoUrl: z.string().optional().nullable(),
      signatureUrl: z.string().optional().nullable(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const updatedSchool = await prisma.school.update({
      where: { id: req.user.schoolId },
      data: req.body,
    })

    res.json(updatedSchool)
  }),
)

export default router
