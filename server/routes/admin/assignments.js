import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../db.js'
import { asyncHandler, validate, HttpError } from '../../utils/http.js'
import { id } from './shared.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const assignments = await prisma.teacherAssignment.findMany({
      where: { schoolId: req.user.schoolId },
      include: { teacher: true, class: true, section: true, subject: true },
      orderBy: [{ class: { sortOrder: 'asc' } }, { section: { name: 'asc' } }, { subject: { name: 'asc' } }],
    })
    res.json(assignments)
  }),
)

router.post(
  '/',
  validate(
    z.object({
      teacherId: id,
      classId: id,
      sectionId: id.optional().nullable(),
      subjectId: id,
    }),
  ),
  asyncHandler(async (req, res) => {
    const teacher = await prisma.user.findFirst({
      where: { id: req.body.teacherId, schoolId: req.user.schoolId, role: 'TEACHER' },
    })
    if (!teacher) throw new HttpError(400, 'Teacher does not exist')

    if (req.body.sectionId) {
      const section = await prisma.section.findFirst({
        where: { id: req.body.sectionId, schoolId: req.user.schoolId, classId: req.body.classId },
      })
      if (!section) throw new HttpError(400, 'Section does not belong to the selected class')
    }

    const existingAssignment = await prisma.teacherAssignment.findFirst({
      where: {
        schoolId: req.user.schoolId,
        teacherId: req.body.teacherId,
        classId: req.body.classId,
        sectionId: req.body.sectionId ?? null,
        subjectId: req.body.subjectId,
      },
    })

    if (existingAssignment) throw new HttpError(409, 'This teacher is already assigned to that class, section, and subject')

    const [assignment, exams] = await Promise.all([
      prisma.teacherAssignment.create({
        data: { ...req.body, schoolId: req.user.schoolId },
        include: { teacher: true, class: true, section: true, subject: true },
      }),
      prisma.exam.findMany({ where: { schoolId: req.user.schoolId } })
    ])

    await Promise.all(exams.map(exam => 
      prisma.examSubject.upsert({
        where: {
          examId_classId_subjectId: {
            examId: exam.id,
            classId: req.body.classId,
            subjectId: req.body.subjectId
          }
        },
        create: {
          schoolId: req.user.schoolId,
          examId: exam.id,
          classId: req.body.classId,
          subjectId: req.body.subjectId
        },
        update: {}
      })
    ))

    res.status(201).json(assignment)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.teacherAssignment.delete({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    })
    res.json({ ok: true })
  }),
)

export default router
