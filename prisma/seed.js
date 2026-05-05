import bcrypt from 'bcryptjs'

import { prisma } from '../server/db.js'

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12)

  const school = await prisma.school.upsert({
    where: { id: 'seed-school' },
    update: {},
    create: {
      id: 'seed-school',
      name: 'Gradex Demonstration School',
      address: 'Kathmandu',
    },
  })

  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      name: 'Global System Admin',
      username: 'superadmin',
      email: 'superadmin@gradex.local',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gradex.local' },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Principal Admin',
      username: 'admin',
      email: 'admin@gradex.local',
      passwordHash,
      role: 'ADMIN',
    },
  })

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@gradex.local' },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Science Teacher',
      username: 'teacher',
      email: 'teacher@gradex.local',
      passwordHash,
      role: 'TEACHER',
    },
  })

  const grade10 = await prisma.class.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Grade 10' } },
    update: {},
    create: { schoolId: school.id, name: 'Grade 10', sortOrder: 10 },
  })

  const sectionA = await prisma.section.upsert({
    where: { classId_name: { classId: grade10.id, name: 'A' } },
    update: {},
    create: { schoolId: school.id, classId: grade10.id, name: 'A' },
  })

  const science = await prisma.subject.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'SCI10' } },
    update: {},
    create: {
      schoolId: school.id,
      code: 'SCI10',
      name: 'Science',
      creditHours: 4,
      theoryFullMarks: 75,
      practicalFullMarks: 25,
      passPercentage: 40,
    },
  })

  await prisma.student.upsert({
    where: { schoolId_admissionNo: { schoolId: school.id, admissionNo: 'GDX-001' } },
    update: {},
    create: {
      schoolId: school.id,
      classId: grade10.id,
      sectionId: sectionA.id,
      admissionNo: 'GDX-001',
      rollNo: '1',
      name: 'Aarav Student',
      guardianName: 'Guardian',
    },
  })

  const existingAssignment = await prisma.teacherAssignment.findFirst({
    where: {
      schoolId: school.id,
      teacherId: teacher.id,
      classId: grade10.id,
      sectionId: sectionA.id,
      subjectId: science.id,
    },
  })

  if (!existingAssignment) {
    await prisma.teacherAssignment.create({
      data: {
        schoolId: school.id,
        teacherId: teacher.id,
        classId: grade10.id,
        sectionId: sectionA.id,
        subjectId: science.id,
      },
    })
  }

  const exam = await prisma.exam.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Midterm' } },
    update: {},
    create: { schoolId: school.id, name: 'Midterm' },
  })

  await prisma.examSubject.upsert({
    where: {
      examId_classId_subjectId: {
        examId: exam.id,
        classId: grade10.id,
        subjectId: science.id,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      examId: exam.id,
      classId: grade10.id,
      subjectId: science.id,
    },
  })

  const rules = [
    ['A+', 90, 100, 4],
    ['A', 80, 89.99, 3.6],
    ['B+', 70, 79.99, 3.2],
    ['B', 60, 69.99, 2.8],
    ['C+', 50, 59.99, 2.4],
    ['C', 40, 49.99, 2],
    ['NG', 0, 39.99, 0],
  ]

  await prisma.gradeRule.deleteMany({ where: { schoolId: school.id } })
  await prisma.gradeRule.createMany({
    data: rules.map(([label, minPercentage, maxPercentage, gpa], sortOrder) => ({
      schoolId: school.id,
      label,
      minPercentage,
      maxPercentage,
      gpa,
      sortOrder,
    })),
  })

  console.log('Seed complete')
  console.log('Super Admin: superadmin / password123')
  console.log('Admin: admin / password123')
  console.log('Teacher: teacher / password123')
  void superAdmin
  void admin
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
