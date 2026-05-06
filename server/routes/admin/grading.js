import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../db.js'
import { asyncHandler, validate } from '../../utils/http.js'
import { decimal } from './shared.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rules = await prisma.gradeRule.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: [{ sortOrder: 'asc' }, { minPercentage: 'desc' }],
    })
    res.json(rules)
  }),
)

router.put(
  '/',
  validate(
    z.object({
      rules: z.array(
        z.object({
          label: z.string().min(1),
          minPercentage: decimal.max(100),
          maxPercentage: decimal.max(100),
          gpa: decimal.max(4.5),
          remarks: z.string().optional(),
        }),
      ),
    }),
  ),
  asyncHandler(async (req, res) => {
    await prisma.$transaction([
      prisma.gradeRule.deleteMany({ where: { schoolId: req.user.schoolId } }),
      ...req.body.rules.map((rule, sortOrder) =>
        prisma.gradeRule.create({
          data: { ...rule, sortOrder, schoolId: req.user.schoolId },
        }),
      ),
    ])

    const rules = await prisma.gradeRule.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { sortOrder: 'asc' },
    })
    res.json(rules)
  }),
)

export default router
