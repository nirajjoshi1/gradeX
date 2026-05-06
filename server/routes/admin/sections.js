import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../db.js'
import { asyncHandler, validate } from '../../utils/http.js'

const router = Router()

router.put(
  '/:id',
  validate(
    z.object({
      name: z.string().min(1),
      classTeacherId: z.string().nullable().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const section = await prisma.section.update({
      where: { id: req.params.id, schoolId: req.user.schoolId },
      data: {
        name: req.body.name,
        classTeacherId: req.body.classTeacherId || null,
      },
      include: { classTeacher: true },
    })
    res.json(section)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.section.delete({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    })
    res.json({ ok: true })
  }),
)

export default router
