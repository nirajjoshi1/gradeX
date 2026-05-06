import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'

import overviewRoutes from './admin/overview.js'
import classesRoutes from './admin/classes.js'
import sectionsRoutes from './admin/sections.js'
import subjectsRoutes from './admin/subjects.js'
import teachersRoutes from './admin/teachers.js'
import studentsRoutes from './admin/students.js'
import assignmentsRoutes from './admin/assignments.js'
import examsRoutes from './admin/exams.js'
import gradingRoutes from './admin/grading.js'

const router = Router()

// Apply authentication and role check to all admin routes
router.use(requireAuth, requireRole('ADMIN'))

// Mount modular routers
router.use('/overview', overviewRoutes)
router.use('/classes', classesRoutes)
router.use('/sections', sectionsRoutes)
router.use('/subjects', subjectsRoutes)
router.use('/teachers', teachersRoutes)
router.use('/students', studentsRoutes)
router.use('/assignments', assignmentsRoutes)
router.use('/exams', examsRoutes)
router.use('/grade-rules', gradingRoutes)

export default router
