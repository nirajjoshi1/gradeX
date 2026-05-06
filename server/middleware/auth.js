import jwt from 'jsonwebtoken'

import { prisma } from '../db.js'
import { env } from '../env.js'
import { HttpError, asyncHandler } from '../utils/http.js'

export const authCookieName = 'gradex_token'

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      schoolId: user.schoolId,
    },
    env.jwtSecret,
    { expiresIn: '8h' },
  )
}

export function setAuthCookie(res, token) {
  res.cookie(authCookieName, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearAuthCookie(res) {
  res.clearCookie(authCookieName, { path: '/' })
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[authCookieName]

  if (!token) {
    throw new HttpError(401, 'Authentication required')
  }

  let payload
  try {
    payload = jwt.verify(token, env.jwtSecret)
  } catch {
    throw new HttpError(401, 'Invalid or expired session')
  }

  const user = await prisma.user.findFirst({
    where: { id: payload.sub, isActive: true },
    include: { school: true },
  })

  if (!user) {
    throw new HttpError(401, 'User no longer exists')
  }

  req.user = user
  next()
})

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission for this action'))
    }

    return next()
  }
}

export async function assertTeacherAssignment({ user, classId, subjectId, sectionId }) {
  if (user.role === 'ADMIN') return true

  if (user.role !== 'TEACHER') {
    throw new HttpError(403, 'Teacher access required')
  }

  // 1. Check if they are the class teacher for this section
  // Class teachers have oversight of all subjects in their section
  if (sectionId) {
    const isClassTeacher = await prisma.section.findFirst({
      where: { id: sectionId, schoolId: user.schoolId, classTeacherId: user.id },
    })
    if (isClassTeacher) return true
  }

  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      schoolId: user.schoolId,
      teacherId: user.id,
      classId,
      subjectId,
      OR: [{ sectionId: null }, { sectionId: sectionId ?? null }],
    },
  })

  if (!assignment) {
    throw new HttpError(403, 'This class, section, and subject is not assigned to you')
  }

  return true
}
