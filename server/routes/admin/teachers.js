import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { prisma } from '../../db.js'
import { asyncHandler, validate, HttpError } from '../../utils/http.js'
import { parseExcelBuffer, mapTeacherHeaders } from '../../utils/excel.js'
import { usernameSchema } from './shared.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const teachers = await prisma.user.findMany({
      where: { schoolId: req.user.schoolId, role: 'TEACHER' },
      select: { 
        id: true, 
        name: true, 
        username: true, 
        email: true, 
        isActive: true,
        teacherAssignments: {
          include: {
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true } },
          }
        }
      },
      orderBy: { name: 'asc' },
    })
    res.json(teachers)
  }),
)

router.post(
  '/',
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
  '/:id',
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
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.user.delete({
      where: { id: req.params.id, schoolId: req.user.schoolId, role: 'TEACHER' },
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
      rawData = mapTeacherHeaders(parsed)
    } else if (req.body.teachers) {
      rawData = req.body.teachers
    } else {
      throw new HttpError(400, 'No teacher data provided')
    }

    const teachersToProcess = rawData.filter(t => t.name || t.username)
    if (!teachersToProcess.length) throw new HttpError(400, 'Teacher list is empty')

    const existingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { username: { in: teachersToProcess.map(t => t.username).filter(Boolean) } },
          { email: { in: teachersToProcess.map(t => t.email).filter(Boolean) } }
        ]
      },
      select: { username: true, email: true }
    })

    const usernames = new Set(existingUsers.map(u => u.username))
    const emails = new Set(existingUsers.map(u => u.email).filter(Boolean))

    const finalTeachers = []
    const errors = []

    for (const [index, t] of teachersToProcess.entries()) {
      const rowNum = index + 1
      try {
        if (!t.name) throw new Error('Name is missing')
        if (!t.username) throw new Error('Username is missing')
        if (usernames.has(t.username)) throw new Error(`Username ${t.username} already taken`)
        if (t.email && emails.has(t.email)) throw new Error(`Email ${t.email} already taken`)

        const hashedPassword = await bcrypt.hash(t.password || 'Teacher@123', 10)
        
        finalTeachers.push({
          schoolId,
          name: t.name,
          username: t.username,
          email: t.email || null,
          passwordHash: hashedPassword,
          role: 'TEACHER'
        })

        usernames.add(t.username)
        if (t.email) emails.add(t.email)
      } catch (err) {
        errors.push({ row: rowNum, error: err.message, name: t.name || 'Unknown' })
      }
    }

    if (errors.length > 0) return res.status(400).json({ errors })

    await prisma.user.createMany({ data: finalTeachers })
    res.json({ message: `Successfully imported ${finalTeachers.length} teachers` })
  })
)

export default router
