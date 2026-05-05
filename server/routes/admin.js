import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { ADToBS, BSToAD } from 'bikram-sambat-js'
import { z } from 'zod'

import { prisma } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import {
  calculateAndCacheStudentExam,
  calculateExamResults,
  getCachedStudentExamSummary,
} from '../services/grading.js'
import { streamReportCard } from '../services/report-card.js'
import { HttpError, asyncHandler, validate } from '../utils/http.js'

const router = Router()

router.use(requireAuth, requireRole('ADMIN'))

const id = z.string().min(1)
const decimal = z.coerce.number().min(0)
const usernameSchema = z.string().trim().min(3).max(32).regex(/^[a-z0-9._-]+$/i, 'Username may only contain letters, numbers, dot, underscore, and dash')
const dateTextSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')

function normalizeDob({ dobAd, dobBs }) {
  const nextDobAd = dobAd?.trim() || null
  const nextDobBs = dobBs?.trim() || null

  try {
    if (nextDobAd && !nextDobBs) {
      return { dobAd: nextDobAd, dobBs: ADToBS(nextDobAd) }
    }

    if (nextDobBs && !nextDobAd) {
      return { dobBs: nextDobBs, dobAd: BSToAD(nextDobBs) }
    }

    if (nextDobAd && nextDobBs) {
      return { dobAd: nextDobAd, dobBs: ADToBS(nextDobAd) }
    }
  } catch {
    throw new HttpError(400, 'Invalid DOB. Use valid AD or BS date in YYYY-MM-DD format')
  }

  return { dobAd: null, dobBs: null }
}

router.get(
  '/overview',
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

router.get(
  '/classes',
  asyncHandler(async (req, res) => {
    const classes = await prisma.class.findMany({
      where: { schoolId: req.user.schoolId },
      include: { sections: { orderBy: { name: 'asc' } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    res.json(classes)
  }),
)

router.post(
  '/classes',
  validate(
    z.object({
      name: z.string().min(1),
      sortOrder: z.coerce.number().int().default(0),
      sections: z.array(z.string().min(1)).default([]),
    }),
  ),
  asyncHandler(async (req, res) => {
    const created = await prisma.class.create({
      data: {
        schoolId: req.user.schoolId,
        name: req.body.name,
        sortOrder: req.body.sortOrder,
        sections: {
          create: req.body.sections.map((name) => ({
            schoolId: req.user.schoolId,
            name,
          })),
        },
      },
      include: { sections: true },
    })
    res.status(201).json(created)
  }),
)

router.put(
  '/classes/:id',
  validate(
    z.object({
      name: z.string().min(1),
      sortOrder: z.coerce.number().int().default(0),
    }),
  ),
  asyncHandler(async (req, res) => {
    const updated = await prisma.class.update({
      where: { id: req.params.id, schoolId: req.user.schoolId },
      data: {
        name: req.body.name,
        sortOrder: req.body.sortOrder,
      },
      include: { sections: true },
    })
    res.json(updated)
  }),
)

router.delete(
  '/classes/:id',
  asyncHandler(async (req, res) => {
    await prisma.class.delete({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    })
    res.json({ ok: true })
  }),
)

router.get(
  '/subjects',
  asyncHandler(async (req, res) => {
    const subjects = await prisma.subject.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { name: 'asc' },
    })
    res.json(subjects)
  }),
)

router.post(
  '/subjects',
  validate(
    z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      creditHours: decimal,
      theoryFullMarks: decimal,
      practicalFullMarks: decimal,
      passPercentage: decimal.default(40),
    }),
  ),
  asyncHandler(async (req, res) => {
    const subject = await prisma.subject.create({
      data: { ...req.body, schoolId: req.user.schoolId },
    })
    res.status(201).json(subject)
  }),
)

router.put(
  '/subjects/:id',
  validate(
    z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      creditHours: decimal,
      theoryFullMarks: decimal,
      practicalFullMarks: decimal,
      passPercentage: decimal.default(40),
    }),
  ),
  asyncHandler(async (req, res) => {
    const subject = await prisma.subject.update({
      where: { id: req.params.id, schoolId: req.user.schoolId },
      data: { ...req.body },
    })
    res.json(subject)
  }),
)

router.delete(
  '/subjects/:id',
  asyncHandler(async (req, res) => {
    await prisma.subject.delete({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    })
    res.json({ ok: true })
  }),
)

router.get(
  '/teachers',
  asyncHandler(async (req, res) => {
    const teachers = await prisma.user.findMany({
      where: { schoolId: req.user.schoolId, role: 'TEACHER' },
      select: { id: true, name: true, username: true, email: true, isActive: true },
      orderBy: { name: 'asc' },
    })
    res.json(teachers)
  }),
)

router.post(
  '/teachers',
  validate(
    z.object({
      name: z.string().min(1),
      username: usernameSchema,
      email: z.string().email().optional().or(z.literal('')),
      password: z.string().min(8),
    }),
  ),
  asyncHandler(async (req, res) => {
    const username = req.body.username.toLowerCase()
    const email = (req.body.email || `${username}.${req.user.schoolId}@gradex.local`).toLowerCase()

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
      select: { username: true, email: true },
    })

    if (existingUser?.username === username) {
      throw new HttpError(409, 'This username is already in use')
    }

    if (existingUser?.email === email) {
      throw new HttpError(409, 'This generated email is already in use; choose a different username')
    }

    const teacher = await prisma.user.create({
      data: {
        schoolId: req.user.schoolId,
        name: req.body.name,
        username,
        email,
        passwordHash: await bcrypt.hash(req.body.password, 12),
        role: 'TEACHER',
      },
      select: { id: true, name: true, username: true, email: true, role: true },
    })
    res.status(201).json(teacher)
  }),
)

router.put(
  '/teachers/:id',
  validate(
    z.object({
      name: z.string().min(1),
      username: usernameSchema,
      email: z.string().email().optional().or(z.literal('')),
      password: z.string().min(8).optional().or(z.literal('')),
      isActive: z.boolean(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const username = req.body.username.toLowerCase()
    const email = (req.body.email || `${username}.${req.user.schoolId}@gradex.local`).toLowerCase()

    const existingUser = await prisma.user.findFirst({
      where: {
        id: { not: req.params.id },
        OR: [
          { username },
          { email },
        ],
      },
    })

    if (existingUser?.username === username) throw new HttpError(409, 'This username is already in use')
    if (existingUser?.email === email) throw new HttpError(409, 'This generated email is already in use; choose a different username')

    const updateData = {
      name: req.body.name,
      username,
      email,
      isActive: req.body.isActive,
    }
    if (req.body.password) {
      updateData.passwordHash = await bcrypt.hash(req.body.password, 12)
    }

    const teacher = await prisma.user.update({
      where: { id: req.params.id, schoolId: req.user.schoolId, role: 'TEACHER' },
      data: updateData,
      select: { id: true, name: true, username: true, email: true, role: true, isActive: true },
    })
    res.json(teacher)
  }),
)

router.delete(
  '/teachers/:id',
  asyncHandler(async (req, res) => {
    await prisma.user.delete({
      where: { id: req.params.id, schoolId: req.user.schoolId, role: 'TEACHER' },
    })
    res.json({ ok: true })
  }),
)

router.get(
  '/students',
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1)
    const pageSize = Math.min(Number(req.query.pageSize ?? 25), 100)
    const where = {
      schoolId: req.user.schoolId,
      ...(req.query.classId ? { classId: String(req.query.classId) } : {}),
      ...(req.query.sectionId ? { sectionId: String(req.query.sectionId) } : {}),
    }

    const [items, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: { class: true, section: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ class: { sortOrder: 'asc' } }, { rollNo: 'asc' }],
      }),
      prisma.student.count({ where }),
    ])

    res.json({ items, total, page, pageSize })
  }),
)

router.post(
  '/students',
  validate(
    z.object({
      name: z.string().min(1),
      admissionNo: z.string().min(1),
      rollNo: z.string().min(1),
      guardianName: z.string().optional(),
      dobAd: dateTextSchema.optional().or(z.literal('')),
      dobBs: dateTextSchema.optional().or(z.literal('')),
      classId: id,
      sectionId: id.optional().nullable(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const dob = normalizeDob({ dobAd: req.body.dobAd, dobBs: req.body.dobBs })
    const student = await prisma.student.create({
      data: {
        ...req.body,
        ...dob,
        schoolId: req.user.schoolId,
      },
      include: { class: true, section: true },
    })
    res.status(201).json(student)
  }),
)

router.put(
  '/students/:id',
  validate(
    z.object({
      name: z.string().min(1),
      admissionNo: z.string().min(1),
      rollNo: z.string().min(1),
      guardianName: z.string().optional(),
      dobAd: dateTextSchema.optional().or(z.literal('')),
      dobBs: dateTextSchema.optional().or(z.literal('')),
      classId: id,
      sectionId: id.optional().nullable(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const dob = normalizeDob({ dobAd: req.body.dobAd, dobBs: req.body.dobBs })
    const student = await prisma.student.update({
      where: { id: req.params.id, schoolId: req.user.schoolId },
      data: {
        ...req.body,
        ...dob,
      },
      include: { class: true, section: true },
    })
    res.json(student)
  }),
)

router.delete(
  '/students/:id',
  asyncHandler(async (req, res) => {
    await prisma.student.delete({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    })
    res.json({ ok: true })
  }),
)

router.get(
  '/assignments',
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
  '/assignments',
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

    if (existingAssignment) {
      throw new HttpError(409, 'This teacher is already assigned to that class, section, and subject')
    }

    const assignment = await prisma.teacherAssignment.create({
      data: { ...req.body, schoolId: req.user.schoolId },
      include: { teacher: true, class: true, section: true, subject: true },
    })
    res.status(201).json(assignment)
  }),
)

router.delete(
  '/assignments/:id',
  asyncHandler(async (req, res) => {
    await prisma.teacherAssignment.delete({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    })
    res.json({ ok: true })
  }),
)

router.get(
  '/exams',
  asyncHandler(async (req, res) => {
    const exams = await prisma.exam.findMany({
      where: { schoolId: req.user.schoolId },
      include: { examSubjects: { include: { class: true, subject: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(exams)
  }),
)

router.post(
  '/exams',
  validate(
    z.object({
      name: z.string().min(1),
      startsAt: z.coerce.date().optional(),
      endsAt: z.coerce.date().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.create({
      data: { ...req.body, schoolId: req.user.schoolId },
    })
    res.status(201).json(exam)
  }),
)

router.put(
  '/exams/:id',
  validate(
    z.object({
      name: z.string().min(1),
      startsAt: z.coerce.date().optional(),
      endsAt: z.coerce.date().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const updated = await prisma.exam.update({
      where: { id: req.params.id, schoolId: req.user.schoolId },
      data: { ...req.body },
    })
    res.json(updated)
  }),
)

router.delete(
  '/exams/:id',
  asyncHandler(async (req, res) => {
    await prisma.exam.delete({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    })
    res.json({ ok: true })
  }),
)

router.post(
  '/exams/:examId/subjects',
  validate(
    z.object({
      classId: id,
      subjectId: id,
    }),
  ),
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.findFirst({
      where: { id: req.params.examId, schoolId: req.user.schoolId },
    })
    if (!exam) throw new HttpError(400, 'Exam not found')

    const examSubject = await prisma.examSubject.create({
      data: {
        schoolId: req.user.schoolId,
        examId: req.params.examId,
        classId: req.body.classId,
        subjectId: req.body.subjectId,
      },
      include: { class: true, subject: true },
    })
    res.status(201).json(examSubject)
  }),
)

router.delete(
  '/exams/:examId/subjects/:examSubjectId',
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.findFirst({
      where: { id: req.params.examId, schoolId: req.user.schoolId },
    })
    if (!exam) throw new HttpError(400, 'Exam not found')

    await prisma.examSubject.delete({
      where: { id: req.params.examSubjectId, examId: req.params.examId, schoolId: req.user.schoolId },
    })
    res.json({ ok: true })
  }),
)

router.get(
  '/grade-rules',
  asyncHandler(async (req, res) => {
    const rules = await prisma.gradeRule.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: [{ sortOrder: 'asc' }, { minPercentage: 'desc' }],
    })
    res.json(rules)
  }),
)

router.put(
  '/grade-rules',
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

router.post(
  '/exams/:examId/report-cards',
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.findFirst({
      where: { id: req.params.examId, schoolId: req.user.schoolId },
    })
    if (!exam) throw new HttpError(404, 'Exam not found')

    await calculateExamResults({ schoolId: req.user.schoolId, examId: exam.id })
    await prisma.$transaction([
      prisma.mark.updateMany({
        where: { schoolId: req.user.schoolId, examId: exam.id },
        data: { lockedAt: new Date() },
      }),
      prisma.examSubject.updateMany({
        where: { schoolId: req.user.schoolId, examId: exam.id },
        data: { isLocked: true },
      }),
      prisma.exam.update({
        where: { id: exam.id },
        data: { isPublished: true, publishedAt: new Date() },
      }),
    ])

    res.json({ ok: true })
  }),
)

router.get(
  '/exams/:examId/report-cards',
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.findFirst({
      where: { id: req.params.examId, schoolId: req.user.schoolId },
    })

    if (!exam) throw new HttpError(404, 'Exam not found')

    const students = await prisma.student.findMany({
      where: {
        schoolId: req.user.schoolId,
        marks: { some: { examId: exam.id } },
      },
      include: { class: true, section: true, results: { where: { examId: exam.id } } },
      orderBy: [{ class: { sortOrder: 'asc' } }, { rollNo: 'asc' }],
    })

    res.json({
      exam: {
        id: exam.id,
        name: exam.name,
        isPublished: exam.isPublished,
      },
      students: students.map((student) => ({
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        admissionNo: student.admissionNo,
        className: student.class.name,
        sectionName: student.section?.name ?? null,
        hasResults: student.results.length > 0,
      })),
    })
  }),
)

router.get(
  '/exams/:examId/report-cards/:studentId.pdf',
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.findFirst({
      where: { id: req.params.examId, schoolId: req.user.schoolId, isPublished: true },
    })

    if (!exam) throw new HttpError(404, 'Finalized exam not found')

    const student = await prisma.student.findFirst({
      where: { id: req.params.studentId, schoolId: req.user.schoolId },
      include: { school: true, class: true, section: true },
    })

    if (!student) throw new HttpError(404, 'Student not found')

    const summary =
      (await getCachedStudentExamSummary({
        schoolId: req.user.schoolId,
        examId: exam.id,
        studentId: student.id,
      })) ??
      (await calculateAndCacheStudentExam({
        schoolId: req.user.schoolId,
        examId: exam.id,
        studentId: student.id,
      }))

    await streamReportCard(res, { student, exam, summary })
  }),
)

export default router
