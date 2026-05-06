import express from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

import { prisma } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { HttpError, asyncHandler, validate } from '../utils/http.js'

const router = express.Router()

router.use(requireAuth)
router.use(requireRole('SUPER_ADMIN'))

router.get(
  '/schools',
  asyncHandler(async (req, res) => {
    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: { users: true, students: true },
        },
        users: {
          where: { role: 'ADMIN' },
          select: { username: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(schools)
  }),
)

router.post(
  '/schools',
  validate(
    z.object({
    name: z.string().min(1),
      address: z.string().optional(),
      adminUsername: z.string().min(3),
      adminEmail: z.string().email().optional().or(z.literal('')),
      adminPassword: z.string().min(6),
    }),
  ),
  asyncHandler(async (req, res) => {
    const existingUser = await prisma.user.findUnique({
      where: { username: req.body.adminUsername },
    })

    if (existingUser) {
      throw new HttpError(400, 'Username is already taken by another user')
    }

    const passwordHash = await bcrypt.hash(req.body.adminPassword, 12)

    // Run in a transaction to ensure both school and admin are created together
    const school = await prisma.$transaction(async (tx) => {
      const newSchool = await tx.school.create({
        data: {
          name: req.body.name,
          address: req.body.address,
        },
      })

      await tx.user.create({
        data: {
          schoolId: newSchool.id,
          name: 'Principal Admin',
          username: req.body.adminUsername,
          email: req.body.adminEmail || null,
          passwordHash,
          role: 'ADMIN',
        },
      })

      // Create default grading rules for the new school
      const defaultRules = [
        { label: 'A+', minPercentage: 90, maxPercentage: 100, gpa: 4, sortOrder: 1 },
        { label: 'A', minPercentage: 80, maxPercentage: 89.99, gpa: 3.6, sortOrder: 2 },
        { label: 'B+', minPercentage: 70, maxPercentage: 79.99, gpa: 3.2, sortOrder: 3 },
        { label: 'B', minPercentage: 60, maxPercentage: 69.99, gpa: 2.8, sortOrder: 4 },
        { label: 'C+', minPercentage: 50, maxPercentage: 59.99, gpa: 2.4, sortOrder: 5 },
        { label: 'C', minPercentage: 40, maxPercentage: 49.99, gpa: 2, sortOrder: 6 },
        { label: 'NG', minPercentage: 0, maxPercentage: 39.99, gpa: 0, sortOrder: 7 },
      ]

      await tx.gradeRule.createMany({
        data: defaultRules.map(rule => ({
          ...rule,
          schoolId: newSchool.id
        }))
      })

      return { school: newSchool, admin: newAdmin }
    })

    res.status(201).json({ school, admin })
  }),
)

router.delete(
  '/schools/:id',
  asyncHandler(async (req, res) => {
    // Cannot delete the seed demonstration school for safety in this demo
    if (req.params.id === 'seed-school') {
      throw new HttpError(400, 'Cannot delete the demonstration school')
    }

    await prisma.school.delete({
      where: { id: req.params.id },
    })
    
    res.json({ ok: true })
  }),
)

export default router
