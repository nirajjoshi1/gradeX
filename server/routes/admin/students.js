import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { prisma } from '../../db.js'
import { asyncHandler, validate, HttpError } from '../../utils/http.js'
import { parseExcelBuffer, mapStudentHeaders } from '../../utils/excel.js'
import { id, dateTextSchema, normalizeDob, getNameSuffix } from './shared.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.get(
  '/',
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
  '/',
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
  '/:id',
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
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.student.delete({
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
      rawData = mapStudentHeaders(parsed)
    } else if (req.body.students) {
      rawData = req.body.students
    } else {
      throw new HttpError(400, 'No student data provided')
    }

    if (!rawData.length) {
      throw new HttpError(400, 'Student list is empty')
    }

    const studentsToProcess = rawData.filter(s => s.name || s.admissionNo)
    if (studentsToProcess.length > 1000) {
      throw new HttpError(400, 'Cannot import more than 1000 students at once')
    }

    const [classes, existingStudents] = await Promise.all([
      prisma.class.findMany({ where: { schoolId }, include: { sections: true } }),
      prisma.student.findMany({ 
        where: { schoolId }, 
        select: { admissionNo: true, name: true, classId: true, sectionId: true } 
      })
    ])

    const classMap = new Map(classes.map(c => [c.id, c]))
    const classNameMap = new Map(classes.map(c => [c.name.toLowerCase().trim(), c]))
    const admissionNoSet = new Set(existingStudents.map(s => s.admissionNo))
    
    const namePool = new Map()
    existingStudents.forEach(s => {
      const key = `${s.classId}_${s.sectionId ?? 'none'}_${s.name.toLowerCase().trim()}`
      namePool.set(key, (namePool.get(key) || 0) + 1)
    })

    const finalStudents = []
    const errors = []

    studentsToProcess.forEach((s, index) => {
      const rowNum = index + 1
      try {
        if (!s.name) throw new Error('Name is missing')
        if (!s.admissionNo) throw new Error('Admission No is missing')
        if (!s.classId) throw new Error('Class ID is missing')

        let targetClass = classMap.get(s.classId) || classNameMap.get(String(s.classId).toLowerCase().trim())
        if (!targetClass) throw new Error(`Class "${s.classId}" not found`)

        let targetSection = null
        if (s.sectionId) {
          const searchName = String(s.sectionId).toLowerCase().trim()
          targetSection = targetClass.sections.find(sec => sec.id === s.sectionId || sec.name.toLowerCase().trim() === searchName)
          if (!targetSection) throw new Error(`Section "${s.sectionId}" not found in class ${targetClass.name}`)
        }

        if (admissionNoSet.has(String(s.admissionNo))) throw new Error(`Duplicate Admission No: ${s.admissionNo}`)
        admissionNoSet.add(String(s.admissionNo))

        let finalName = s.name.trim()
        const nameKey = `${s.classId}_${s.sectionId ?? 'none'}_${finalName.toLowerCase()}`
        const count = namePool.get(nameKey) || 0
        if (count > 0) finalName = `${finalName} '${getNameSuffix(count - 1)}'`
        namePool.set(nameKey, count + 1)

        const dob = normalizeDob({ dobAd: s.dobAd, dobBs: s.dobBs })

        finalStudents.push({
          schoolId,
          name: finalName,
          admissionNo: String(s.admissionNo),
          rollNo: String(s.rollNo || ''),
          classId: targetClass.id,
          sectionId: targetSection?.id || null,
          guardianName: s.guardianName || null,
          ...dob
        })
      } catch (err) {
        errors.push({ row: rowNum, error: err.message, name: s.name || 'Unknown' })
      }
    })

    if (errors.length > 0) return res.status(400).json({ errors })

    await prisma.$transaction(
      finalStudents.map(student => prisma.student.create({ data: student })),
      { timeout: 60000 }
    )

    res.json({ ok: true, count: finalStudents.length })
  }),
)

export default router
