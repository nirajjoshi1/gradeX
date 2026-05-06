import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { prisma } from '../../db.js'
import { asyncHandler, validate, HttpError } from '../../utils/http.js'
import { parseExcelBuffer, mapClassHeaders } from '../../utils/excel.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const classes = await prisma.class.findMany({
      where: { schoolId: req.user.schoolId },
      include: {
        sections: { include: { classTeacher: true }, orderBy: { name: 'asc' } },
        subjects: true
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    res.json(classes)
  }),
)

router.post(
  '/',
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
  '/:id',
  validate(
    z.object({
      name: z.string().min(1),
      sortOrder: z.coerce.number().int().default(1),
      subjects: z.array(z.string()).optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const updated = await prisma.class.update({
      where: { id: req.params.id, schoolId: req.user.schoolId },
      data: {
        name: req.body.name,
        sortOrder: req.body.sortOrder,
        subjects: req.body.subjects ? {
          set: req.body.subjects.map(id => ({ id }))
        } : undefined
      },
      include: { sections: true, subjects: true },
    })

    if (req.body.subjects) {
      const exams = await prisma.exam.findMany({ where: { schoolId: req.user.schoolId } })
      for (const exam of exams) {
        for (const subjectId of req.body.subjects) {
          await prisma.examSubject.upsert({
            where: {
              schoolId_examId_classId_subjectId: {
                schoolId: req.user.schoolId,
                examId: exam.id,
                classId: updated.id,
                subjectId
              }
            },
            create: {
              schoolId: req.user.schoolId,
              examId: exam.id,
              classId: updated.id,
              subjectId
            },
            update: {}
          }).catch(() => null)
        }
      }
    }

    res.json(updated)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.class.delete({
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
      rawData = mapClassHeaders(parsed)
    } else if (req.body.classes) {
      rawData = req.body.classes
    } else {
      throw new HttpError(400, 'No class data provided')
    }

    const classesToProcess = rawData.filter(c => c.name)
    if (!classesToProcess.length) throw new HttpError(400, 'Class list is empty')

    const existing = await prisma.class.findMany({
      where: { schoolId, name: { in: classesToProcess.map(c => c.name).filter(Boolean) } },
      select: { name: true }
    })
    const existingNames = new Set(existing.map(c => c.name))

    const errors = []
    const validClasses = []

    classesToProcess.forEach((c, index) => {
      const rowNum = index + 1
      try {
        if (!c.name) throw new Error('Name is missing')
        if (existingNames.has(c.name)) throw new Error(`Class ${c.name} already exists`)

        validClasses.push({
          name: c.name,
          sortOrder: Number(c.sortOrder || 0),
          sections: c.sections || 'A,B'
        })
        existingNames.add(c.name)
      } catch (err) {
        errors.push({ row: rowNum, error: err.message, name: c.name || 'Unknown' })
      }
    })

    if (errors.length > 0) return res.status(400).json({ errors })

    await prisma.$transaction(async (tx) => {
      for (const c of validClasses) {
        const sectionNames = c.sections.split(',').map(s => s.trim()).filter(Boolean)
        await tx.class.create({
          data: {
            schoolId,
            name: c.name,
            sortOrder: c.sortOrder,
            sections: {
              create: sectionNames.map(name => ({ schoolId, name }))
            }
          }
        })
      }
    }, { timeout: 60000 })

    res.json({ message: `Successfully imported ${validClasses.length} classes` })
  })
)

// Section management routes moved from admin.js but still under /classes logic if needed, 
// or I can put them in sections.js. In admin.js they were top-level /classes/:classId/sections 
// and /sections/:id. I'll keep them here for now or move to separate if preferred.

router.post(
  '/:classId/sections',
  validate(
    z.object({
      name: z.string().min(1),
      classTeacherId: z.string().nullable().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const section = await prisma.section.create({
      data: {
        schoolId: req.user.schoolId,
        classId: req.params.classId,
        name: req.body.name,
        classTeacherId: req.body.classTeacherId || null,
      },
      include: { classTeacher: true },
    })
    res.status(201).json(section)
  }),
)

export default router
