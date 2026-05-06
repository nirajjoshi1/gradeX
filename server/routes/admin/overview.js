import { Router } from 'express'
import { prisma } from '../../db.js'
import { asyncHandler } from '../../utils/http.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId
    const [classes, students, teachers, subjects, exams, unpublishedMarks] =
      await Promise.all([
        prisma.class.count({ where: { schoolId } }),
        prisma.student.count({ where: { schoolId } }),
        prisma.user.count({ where: { schoolId, role: 'TEACHER' } }),
        prisma.subject.count({ where: { schoolId } }),
        prisma.exam.count({ where: { schoolId } }),
        prisma.mark.count({ where: { schoolId, lockedAt: null } }),
      ])

    res.json({ classes, students, teachers, subjects, exams, unpublishedMarks })
  }),
)

export default router
