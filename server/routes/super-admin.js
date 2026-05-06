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
    const { name, address, adminUsername, adminEmail, adminPassword } = req.body
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    // Checks for existing username/email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: adminUsername.toLowerCase() },
          ...(adminEmail ? [{ email: adminEmail.toLowerCase() }] : [])
        ]
      }
    })

    if (existing) {
      if (existing.username === adminUsername.toLowerCase()) {
        throw new HttpError(400, 'Username is already taken')
      }
      throw new HttpError(400, 'Email address is already in use')
    }

    // Check for existing slug
    const existingSchool = await prisma.school.findUnique({ where: { slug } })
    if (existingSchool) {
      throw new HttpError(400, 'A school with a similar name already exists; please use a more unique name')
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12)

    // Run in a transaction to ensure both school and admin are created together
    const result = await prisma.$transaction(async (tx) => {
      const newSchool = await tx.school.create({
        data: {
          name,
          slug,
          address,
        },
      })

      const newAdmin = await tx.user.create({
        data: {
          schoolId: newSchool.id,
          name: 'Principal Admin',
          username: adminUsername.toLowerCase(),
          email: adminEmail ? adminEmail.toLowerCase() : null,
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

    res.status(201).json(result)
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
