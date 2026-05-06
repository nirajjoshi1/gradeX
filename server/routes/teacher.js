import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../db.js'
import {
  assertTeacherAssignment,
  requireAuth,
  requireRole,
} from '../middleware/auth.js'
import { calculateAndCacheStudentExam } from '../services/grading.js'
import { HttpError, asyncHandler, validate } from '../utils/http.js'

const router = Router()
const id = z.string().min(1)
const markValue = z.coerce.number().min(0).nullable().optional()

router.use(requireAuth, requireRole('TEACHER'))

// --- NEW CLASS TEACHER FEATURE ---

router.get(
  '/managed-sections',
  asyncHandler(async (req, res) => {
    const sections = await prisma.section.findMany({
      where: { schoolId: req.user.schoolId, classTeacherId: req.user.id },
      include: { class: true },
    })
    res.json(sections)
  }),
)

router.get(
  '/managed-sections/:id/assignments',
  asyncHandler(async (req, res) => {
    const section = await prisma.section.findFirst({
      where: { id: req.params.id, schoolId: req.user.schoolId, classTeacherId: req.user.id },
    })
    if (!section) throw new HttpError(403, 'You are not the class teacher for this section')

    const assignments = await prisma.teacherAssignment.findMany({
      where: { schoolId: req.user.schoolId, classId: section.classId, sectionId: section.id },
      include: { teacher: true, subject: true },
      orderBy: { subject: { name: 'asc' } },
    })
    res.json(assignments)
  }),
)

router.post(
  '/managed-sections/:id/assignments',
  validate(
    z.object({
      teacherId: z.string().min(1),
      subjectId: z.string().min(1),
    }),
  ),
  asyncHandler(async (req, res) => {
    const section = await prisma.section.findFirst({
      where: { id: req.params.id, schoolId: req.user.schoolId, classTeacherId: req.user.id },
    })
    if (!section) throw new HttpError(403, 'You are not the class teacher for this section')

    const assignment = await prisma.teacherAssignment.create({
      data: {
        schoolId: req.user.schoolId,
        teacherId: req.body.teacherId,
        classId: section.classId,
        sectionId: section.id,
        subjectId: req.body.subjectId,
      },
      include: { teacher: true, subject: true },
    })
    res.status(201).json(assignment)
  }),
)

router.delete(
  '/managed-sections/:id/assignments/:assignmentId',
  asyncHandler(async (req, res) => {
    const section = await prisma.section.findFirst({
      where: { id: req.params.id, schoolId: req.user.schoolId, classTeacherId: req.user.id },
    })
    if (!section) throw new HttpError(403, 'You are not the class teacher for this section')

    await prisma.teacherAssignment.delete({
      where: { id: req.params.assignmentId, schoolId: req.user.schoolId, sectionId: section.id },
    })
    res.json({ ok: true })
  }),
)

// Helper to fetch teachers and subjects for assignment
router.get(
  '/resources',
  asyncHandler(async (req, res) => {
    const [teachers, subjects] = await Promise.all([
      prisma.user.findMany({
        where: { schoolId: req.user.schoolId, role: 'TEACHER' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.subject.findMany({
        where: { schoolId: req.user.schoolId },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
    ])
    res.json({ teachers, subjects })
  }),
)

// --- END CLASS TEACHER FEATURE ---

// GET /teacher/stats — dashboard overview counters
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [assignments, managedSections] = await Promise.all([
      prisma.teacherAssignment.findMany({
        where: { schoolId: req.user.schoolId, teacherId: req.user.id },
        select: { classId: true, sectionId: true, subjectId: true },
      }),
      prisma.section.findMany({
        where: { schoolId: req.user.schoolId, classTeacherId: req.user.id },
        select: { classId: true, id: true },
      }),
    ])

    if (assignments.length === 0 && managedSections.length === 0) {
      return res.json({ students: 0, subjects: 0, classes: 0, pendingMarks: 0, lockedMarks: 0 })
    }

    const uniqueClassIds = new Set([...assignments.map((a) => a.classId), ...managedSections.map((s) => s.classId)])
    const uniqueSubjectIds = new Set(assignments.map((a) => a.subjectId))

    const accessConditions = [
      ...assignments.map((a) => ({
        classId: a.classId,
        ...(a.sectionId ? { sectionId: a.sectionId } : {}),
      })),
      ...managedSections.map((s) => ({
        classId: s.classId,
        sectionId: s.id,
      })),
    ]

    const [studentCount, pendingMarks, lockedMarks] = await Promise.all([
      prisma.student.count({
        where: {
          schoolId: req.user.schoolId,
          OR: accessConditions,
        },
      }),
      prisma.mark.count({ where: { schoolId: req.user.schoolId, enteredById: req.user.id, lockedAt: null } }),
      prisma.mark.count({ where: { schoolId: req.user.schoolId, enteredById: req.user.id, lockedAt: { not: null } } }),
    ])

    res.json({
      students: studentCount,
      subjects: uniqueSubjectIds.size,
      classes: uniqueClassIds.size,
      pendingMarks,
      lockedMarks,
    })
  }),
)

// GET /teacher/students — all students in teacher's assigned classes
router.get(
  '/students',
  asyncHandler(async (req, res) => {
    const [assignments, managedSections] = await Promise.all([
      prisma.teacherAssignment.findMany({
        where: { schoolId: req.user.schoolId, teacherId: req.user.id },
        select: { classId: true, sectionId: true },
      }),
      prisma.section.findMany({
        where: { schoolId: req.user.schoolId, classTeacherId: req.user.id },
        select: { classId: true, id: true },
      }),
    ])

    if (assignments.length === 0 && managedSections.length === 0) return res.json({ items: [], total: 0 })

    const classId = req.query.classId ? String(req.query.classId) : null
    const sectionId = req.query.sectionId ? String(req.query.sectionId) : null
    const search = req.query.search ? String(req.query.search).trim() : null
    const page = Math.max(1, Number(req.query.page ?? 1))
    const pageSize = Math.min(Number(req.query.pageSize ?? 30), 100)

    const accessConditions = [
      ...assignments.map((a) => ({
        classId: a.classId,
        ...(a.sectionId ? { sectionId: a.sectionId } : {}),
      })),
      ...managedSections.map((s) => ({
        classId: s.classId,
        sectionId: s.id,
      })),
    ].filter((cond) => {
      if (classId && cond.classId !== classId) return false
      if (sectionId && cond.sectionId && cond.sectionId !== sectionId) return false
      return true
    })

    if (!accessConditions.length) return res.json({ items: [], total: 0 })

    const where = {
      schoolId: req.user.schoolId,
      OR: accessConditions,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { admissionNo: { contains: search, mode: 'insensitive' } },
              { rollNo: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: { class: true, section: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ class: { sortOrder: 'asc' } }, { section: { name: 'asc' } }, { rollNo: 'asc' }],
      }),
      prisma.student.count({ where }),
    ])

    res.json({ items, total, page, pageSize })
  }),
)

router.get(
  '/assignments',
  asyncHandler(async (req, res) => {
    const assignments = await prisma.teacherAssignment.findMany({
      where: { schoolId: req.user.schoolId, teacherId: req.user.id },
      include: { class: true, section: true, subject: true },
      orderBy: [{ class: { sortOrder: 'asc' } }, { section: { name: 'asc' } }, { subject: { name: 'asc' } }],
    })
    res.json(assignments)
  }),
)

router.get(
  '/exams',
  asyncHandler(async (req, res) => {
    const [assignments, managedSections] = await Promise.all([
      prisma.teacherAssignment.findMany({
        where: { schoolId: req.user.schoolId, teacherId: req.user.id },
        include: { class: true, section: true, subject: true },
      }),
      prisma.section.findMany({
        where: { schoolId: req.user.schoolId, classTeacherId: req.user.id },
        include: { class: true },
      }),
    ])

    const examSubjects = await prisma.examSubject.findMany({
      where: { schoolId: req.user.schoolId },
      include: { exam: true, class: true, subject: true },
      orderBy: { createdAt: 'desc' },
    })

    const accessible = []

    // 1. Add direct subject assignments
    assignments.forEach((assignment) => {
      examSubjects
        .filter((es) => es.classId === assignment.classId && es.subjectId === assignment.subjectId)
        .forEach((es) => {
          accessible.push({
            ...es,
            id: `${es.id}:${assignment.sectionId ?? 'all'}`,
            examSubjectId: es.id,
            sectionId: assignment.sectionId,
            section: assignment.section,
          })
        })
    })

    // 2. Add managed section oversight (Class Teacher gets ALL subjects in their section)
    managedSections.forEach((ms) => {
      examSubjects
        .filter((es) => es.classId === ms.classId)
        .forEach((es) => {
          // Only add if not already present as a direct assignment (to avoid duplicates)
          const exists = accessible.some((acc) => acc.examSubjectId === es.id && acc.sectionId === ms.id)
          if (!exists) {
            accessible.push({
              ...es,
              id: `${es.id}:${ms.id}`,
              examSubjectId: es.id,
              sectionId: ms.id,
              section: ms,
            })
          }
        })
    })

    res.json(accessible)
  }),
)

router.get(
  '/marks',
  asyncHandler(async (req, res) => {
    const examId = String(req.query.examId ?? '')
    const classId = String(req.query.classId ?? '')
    const subjectId = String(req.query.subjectId ?? '')
    const sectionId = req.query.sectionId ? String(req.query.sectionId) : null
    const page = Number(req.query.page ?? 1)
    const pageSize = Math.min(Number(req.query.pageSize ?? 80), 200)

    if (!examId || !classId || !subjectId) {
      throw new HttpError(400, 'examId, classId and subjectId are required')
    }

    await assertTeacherAssignment({ user: req.user, classId, subjectId, sectionId })

    const examSubject = await prisma.examSubject.findUnique({
      where: { examId_classId_subjectId: { examId, classId, subjectId } },
      include: { exam: true, subject: true },
    })

    if (!examSubject || examSubject.schoolId !== req.user.schoolId) {
      throw new HttpError(404, 'This subject is not attached to the exam')
    }

    const [students, total, marks] = await Promise.all([
      prisma.student.findMany({
        where: { schoolId: req.user.schoolId, classId, ...(sectionId ? { sectionId } : {}) },
        include: { class: true, section: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ section: { name: 'asc' } }, { rollNo: 'asc' }],
      }),
      prisma.student.count({ where: { schoolId: req.user.schoolId, classId, ...(sectionId ? { sectionId } : {}) } }),
      prisma.mark.findMany({
        where: { schoolId: req.user.schoolId, examId, subjectId },
      }),
    ])

    const marksByStudent = new Map(marks.map((mark) => [mark.studentId, mark]))
    res.json({
      subject: examSubject.subject,
      sectionId,
      locked: examSubject.isLocked || examSubject.exam.isPublished,
      total,
      page,
      pageSize,
      rows: students.map((student) => ({
        student,
        mark: marksByStudent.get(student.id) ?? null,
      })),
    })
  }),
)

router.put(
  '/marks/bulk',
  validate(
    z.object({
      examId: id,
      classId: id,
      subjectId: id,
      sectionId: id.optional().nullable(),
      entries: z.array(
        z.object({
          studentId: id,
          theoryMarks: markValue,
          practicalMarks: markValue,
          isAbsent: z.boolean().default(false),
          remarks: z.string().optional().nullable(),
        }),
      ),
    }),
  ),
  asyncHandler(async (req, res) => {
    const { examId, classId, subjectId, sectionId, entries } = req.body
    await assertTeacherAssignment({ user: req.user, classId, subjectId, sectionId: sectionId ?? null })

    const examSubject = await prisma.examSubject.findUnique({
      where: { examId_classId_subjectId: { examId, classId, subjectId } },
      include: { exam: true, subject: true },
    })

    if (!examSubject || examSubject.schoolId !== req.user.schoolId) {
      throw new HttpError(404, 'This subject is not attached to the exam')
    }

    if (examSubject.isLocked || examSubject.exam.isPublished) {
      throw new HttpError(409, 'Marks are locked for this subject')
    }

    const validStudents = await prisma.student.findMany({
      where: {
        schoolId: req.user.schoolId,
        classId,
        ...(sectionId ? { sectionId } : {}),
        id: { in: entries.map((entry) => entry.studentId) },
      },
      select: { id: true },
    })
    const validStudentIds = new Set(validStudents.map((student) => student.id))

    const theoryFull = Number(examSubject.subject.theoryFullMarks)
    const practicalFull = Number(examSubject.subject.practicalFullMarks)

    const writes = entries.map((entry) => {
      if (!validStudentIds.has(entry.studentId)) {
        throw new HttpError(403, 'A submitted student is not in this class')
      }

      if (!entry.isAbsent) {
        if (Number(entry.theoryMarks ?? 0) > theoryFull) {
          throw new HttpError(400, 'Theory marks exceed full marks')
        }
        if (Number(entry.practicalMarks ?? 0) > practicalFull) {
          throw new HttpError(400, 'Practical marks exceed full marks')
        }
      }

      return prisma.mark.upsert({
        where: {
          examId_studentId_subjectId: {
            examId,
            studentId: entry.studentId,
            subjectId,
          },
        },
        update: {
          theoryMarks: entry.isAbsent ? null : entry.theoryMarks,
          practicalMarks: entry.isAbsent ? null : entry.practicalMarks,
          isAbsent: entry.isAbsent,
          status: entry.isAbsent ? 'ABSENT' : 'PASS',
          remarks: entry.remarks,
          enteredById: req.user.id,
        },
        create: {
          schoolId: req.user.schoolId,
          examId,
          studentId: entry.studentId,
          subjectId,
          theoryMarks: entry.isAbsent ? null : entry.theoryMarks,
          practicalMarks: entry.isAbsent ? null : entry.practicalMarks,
          isAbsent: entry.isAbsent,
          status: entry.isAbsent ? 'ABSENT' : 'PASS',
          remarks: entry.remarks,
          enteredById: req.user.id,
        },
      })
    })

    await prisma.$transaction(writes)
    await Promise.all(
      entries.map((entry) =>
        calculateAndCacheStudentExam({
          schoolId: req.user.schoolId,
          examId,
          studentId: entry.studentId,
        }),
      ),
    )

    res.json({ ok: true, saved: entries.length })
  }),
)

export default router
