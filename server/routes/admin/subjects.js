import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { prisma } from '../../db.js'
import { asyncHandler, validate, HttpError } from '../../utils/http.js'
import { parseExcelBuffer, mapSubjectHeaders } from '../../utils/excel.js'
import { decimal } from './shared.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const subjects = await prisma.subject.findMany({
      where: { schoolId: req.user.schoolId },
      include: { classes: true },
      orderBy: { name: 'asc' },
    })
    res.json(subjects)
  }),
)

router.post(
  '/',
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
  '/:id',
  validate(
    z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      creditHours: decimal,
      theoryFullMarks: decimal,
      practicalFullMarks: decimal,
      passPercentage: decimal.default(40),
      classes: z.array(z.string()).optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const data = {
      code: req.body.code,
      name: req.body.name,
      creditHours: req.body.creditHours,
      theoryFullMarks: req.body.theoryFullMarks,
      practicalFullMarks: req.body.practicalFullMarks,
      passPercentage: req.body.passPercentage,
    }

    if (req.body.classes) {
      data.classes = { set: req.body.classes.map(id => ({ id })) }
    }

    const subject = await prisma.subject.update({
      where: { id: req.params.id, schoolId: req.user.schoolId },
      data,
      include: { classes: true },
    })

    if (req.body.classes) {
      const exams = await prisma.exam.findMany({ where: { schoolId: req.user.schoolId } })
      for (const exam of exams) {
        for (const classId of req.body.classes) {
          await prisma.examSubject.upsert({
            where: {
              examId_classId_subjectId: {
                examId: exam.id,
                classId,
                subjectId: subject.id
              }
            },
            create: {
              schoolId: req.user.schoolId,
              examId: exam.id,
              classId,
              subjectId: subject.id,
            },
            update: {}
          })
        }
      }
    }

    res.json(subject)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.subject.delete({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    })
    res.json({ ok: true })
  }),
)

router.post(
  '/bulk',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const schoolId = req.user.schoolId
    let rawData = []

    if (req.file) {
      const parsed = parseExcelBuffer(req.file.buffer)
      rawData = mapSubjectHeaders(parsed)
    } else if (req.body.subjects) {
      rawData = req.body.subjects
    } else {
      throw new HttpError(400, 'No subject data provided')
    }

    const subjectsToProcess = rawData.filter(s => s.name || s.code)
    if (!subjectsToProcess.length) throw new HttpError(400, 'Subject list is empty')

    const existing = await prisma.subject.findMany({
      where: { schoolId, code: { in: subjectsToProcess.map(s => s.code).filter(Boolean) } },
      select: { code: true }
    })
    const existingCodes = new Set(existing.map(s => s.code))

    const finalSubjects = []
    const errors = []

    subjectsToProcess.forEach((s, index) => {
      const rowNum = index + 1
      try {
        if (!s.name) throw new Error('Name is missing')
        if (!s.code) throw new Error('Code is missing')
        if (existingCodes.has(s.code)) throw new Error(`Code ${s.code} already exists`)

        finalSubjects.push({
          schoolId,
          name: s.name,
          code: s.code,
          creditHours: Number(s.creditHours || 4),
          theoryFullMarks: Number(s.theoryFullMarks || 75),
          practicalFullMarks: Number(s.practicalFullMarks || 25),
          passPercentage: Number(s.passPercentage || 40),
        })
        existingCodes.add(s.code)
      } catch (err) {
        errors.push({ row: rowNum, error: err.message, name: s.name || 'Unknown' })
      }
    })

    if (errors.length > 0) return res.status(400).json({ errors })

    await prisma.subject.createMany({ data: finalSubjects })
    res.json({ message: `Successfully imported ${finalSubjects.length} subjects` })
  })
)

export default router
