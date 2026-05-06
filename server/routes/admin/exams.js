import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../db.js'
import { asyncHandler, validate, HttpError } from '../../utils/http.js'
import { 
  calculateAndCacheStudentExam, 
  calculateExamResults, 
  getCachedStudentExamSummary 
} from '../../services/grading.js'
import { streamReportCard } from '../../services/report-card.js'
import { id } from './shared.js'

const router = Router()

router.get(
  '/',
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
  '/',
  validate(
    z.object({
      name: z.string().min(1),
      startsAt: z.coerce.date().optional(),
      endsAt: z.coerce.date().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const [exam, assignments] = await Promise.all([
      prisma.exam.create({
        data: { ...req.body, schoolId: req.user.schoolId },
      }),
      prisma.teacherAssignment.findMany({ where: { schoolId: req.user.schoolId } })
    ])

    const uniquePairs = Array.from(new Set(assignments.map(a => `${a.classId}_${a.subjectId}`)))
    
    await Promise.all(uniquePairs.map(pair => {
      const [classId, subjectId] = pair.split('_')
      return prisma.examSubject.upsert({
        where: {
          schoolId_examId_classId_subjectId: {
            schoolId: req.user.schoolId,
            examId: exam.id,
            classId,
            subjectId
          }
        },
        create: {
          schoolId: req.user.schoolId,
          examId: exam.id,
          classId,
          subjectId
        },
        update: {}
      })
    }))

    res.status(201).json(exam)
  }),
)

router.put(
  '/:id',
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
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.exam.delete({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    })
    res.json({ ok: true })
  }),
)

router.post(
  '/:examId/subjects',
  validate(z.object({ classId: id, subjectId: id })),
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.findFirst({ where: { id: req.params.examId, schoolId: req.user.schoolId } })
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
  '/:examId/subjects/:examSubjectId',
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.findFirst({ where: { id: req.params.examId, schoolId: req.user.schoolId } })
    if (!exam) throw new HttpError(400, 'Exam not found')

    await prisma.examSubject.delete({
      where: { id: req.params.examSubjectId, examId: req.params.examId, schoolId: req.user.schoolId },
    })
    res.json({ ok: true })
  }),
)

router.post(
  '/:examId/report-cards',
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.findFirst({ where: { id: req.params.examId, schoolId: req.user.schoolId } })
    if (!exam) throw new HttpError(404, 'Exam not found')

    await calculateExamResults({ schoolId: req.user.schoolId, examId: exam.id })
    await prisma.$transaction([
      prisma.mark.updateMany({ where: { schoolId: req.user.schoolId, examId: exam.id }, data: { lockedAt: new Date() } }),
      prisma.examSubject.updateMany({ where: { schoolId: req.user.schoolId, examId: exam.id }, data: { isLocked: true } }),
      prisma.exam.update({ where: { id: exam.id }, data: { isPublished: true, publishedAt: new Date() } }),
    ])
    res.json({ ok: true })
  }),
)

router.get(
  '/:examId/report-cards',
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.findFirst({ where: { id: req.params.examId, schoolId: req.user.schoolId } })
    if (!exam) throw new HttpError(404, 'Exam not found')

    const students = await prisma.student.findMany({
      where: { schoolId: req.user.schoolId, marks: { some: { examId: exam.id } } },
      include: { class: true, section: true, results: { where: { examId: exam.id } } },
      orderBy: [{ class: { sortOrder: 'asc' } }, { rollNo: 'asc' }],
    })

    res.json({
      exam: { id: exam.id, name: exam.name, isPublished: exam.isPublished },
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
  '/:examId/report-cards/:studentId.pdf',
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.findFirst({ where: { id: req.params.examId, schoolId: req.user.schoolId, isPublished: true } })
    if (!exam) throw new HttpError(404, 'Finalized exam not found')

    const student = await prisma.student.findFirst({
      where: { id: req.params.studentId, schoolId: req.user.schoolId },
      include: { school: true, class: true, section: true },
    })
    if (!student) throw new HttpError(404, 'Student not found')

    const summary = (await getCachedStudentExamSummary({ schoolId: req.user.schoolId, examId: exam.id, studentId: student.id })) ??
      (await calculateAndCacheStudentExam({ schoolId: req.user.schoolId, examId: exam.id, studentId: student.id }))

    await streamReportCard(res, { student, exam, summary })
  }),
)

router.get(
  '/:id/ledger',
  asyncHandler(async (req, res) => {
    const { schoolId } = req.user
    const { id: examId } = req.params
    const { classId, sectionId } = req.query
    if (!classId) throw new HttpError(400, 'Class ID is required')

    const [examSubjects, students, marks, results] = await Promise.all([
      prisma.examSubject.findMany({ where: { examId, classId, schoolId }, include: { subject: true } }),
      prisma.student.findMany({ where: { schoolId, classId, ...(sectionId ? { sectionId } : {}) }, orderBy: { rollNo: 'asc' } }),
      prisma.mark.findMany({ where: { examId, schoolId, studentId: { in: (await prisma.student.findMany({ where: { classId, schoolId }, select: { id: true } })).map(s => s.id) } } }),
      prisma.result.findMany({ where: { examId, schoolId, studentId: { in: (await prisma.student.findMany({ where: { classId, schoolId }, select: { id: true } })).map(s => s.id) } } })
    ])

    const subjects = examSubjects.map(es => es.subject)
    const ledger = students.map(student => {
      const studentMarks = marks.filter(m => m.studentId === student.id)
      const studentResults = results.filter(r => r.studentId === student.id)
      const subjectData = subjects.map(subject => {
        const mark = studentMarks.find(m => m.subjectId === subject.id)
        const res = studentResults.find(r => r.subjectId === subject.id)
        return {
          subjectId: subject.id,
          theory: mark?.theoryMarks,
          practical: mark?.practicalMarks,
          total: res?.finalPercentage,
          grade: res?.finalGrade,
          gpa: res?.finalGpa,
          isAbsent: mark?.isAbsent || false
        }
      })
      return {
        student: { id: student.id, name: student.name, rollNo: student.rollNo, admissionNo: student.admissionNo },
        subjects: subjectData
      }
    })
    res.json({ subjects, ledger })
  })
)

export default router
