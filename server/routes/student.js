import { Router } from 'express'

import { prisma } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { calculateAndCacheStudentExam } from '../services/grading.js'
import { streamReportCard } from '../services/report-card.js'
import { HttpError, asyncHandler } from '../utils/http.js'

const router = Router()

router.use(requireAuth, requireRole('STUDENT'))

async function getStudentProfile(user) {
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: { school: true, class: true, section: true },
  })

  if (!student) {
    throw new HttpError(404, 'No student profile linked to this account')
  }

  return student
}

router.get(
  '/results',
  asyncHandler(async (req, res) => {
    const student = await getStudentProfile(req.user)
    const exams = await prisma.exam.findMany({
      where: {
        schoolId: req.user.schoolId,
        isPublished: true,
        results: { some: { studentId: student.id } },
      },
      orderBy: { publishedAt: 'desc' },
    })

    const results = await Promise.all(
      exams.map(async (exam) => ({
        exam,
        summary: await calculateAndCacheStudentExam({
          schoolId: req.user.schoolId,
          examId: exam.id,
          studentId: student.id,
        }),
      })),
    )

    res.json({ student, results })
  }),
)

router.get(
  '/reports/:examId.pdf',
  asyncHandler(async (req, res) => {
    const student = await getStudentProfile(req.user)
    const exam = await prisma.exam.findFirst({
      where: { id: req.params.examId, schoolId: req.user.schoolId, isPublished: true },
    })

    if (!exam) throw new HttpError(404, 'Published exam not found')

    const summary = await calculateAndCacheStudentExam({
      schoolId: req.user.schoolId,
      examId: exam.id,
      studentId: student.id,
    })

    await streamReportCard(res, { student, exam, summary })
  }),
)

export default router
