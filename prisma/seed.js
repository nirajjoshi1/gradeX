import bcrypt from 'bcryptjs'
import { prisma } from '../server/db.js'

async function main() {
  console.log('🚀 Starting deep seed...')
  
  const passwordHash = await bcrypt.hash('password123', 12)

  // 1. CLEAR EVERYTHING (Order matters for foreign keys)
  console.log('🧹 Wiping existing data...')
  await prisma.mark.deleteMany()
  await prisma.examSubject.deleteMany()
  await prisma.exam.deleteMany()
  await prisma.teacherAssignment.deleteMany()
  await prisma.student.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.section.deleteMany()
  await prisma.class.deleteMany()
  await prisma.gradeRule.deleteMany()
  await prisma.user.deleteMany()
  await prisma.school.deleteMany()

  // 2. CREATE SUPER ADMIN
  console.log('👑 Creating Super Admin...')
  await prisma.user.create({
    data: {
      name: 'GradeX Master',
      username: 'superadmin',
      email: 'master@gradex.io',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  })

  // 3. CREATE DEMO SCHOOL
  console.log('🏫 Creating Demo School...')
  const school = await prisma.school.create({
    data: {
      name: 'St. Marys International Academy',
      slug: 'demo',
      address: 'Kathmandu, Nepal',
      logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200&h=200',
    },
  })

  // 4. CREATE SCHOOL ADMIN
  await prisma.user.create({
    data: {
      schoolId: school.id,
      name: 'Dr. Sarah Wilson',
      username: 'admin',
      email: 'sarah@demo.edu',
      passwordHash,
      role: 'ADMIN',
    },
  })

  // 5. CREATE TEACHERS
  const teacherA = await prisma.user.create({
    data: {
      schoolId: school.id,
      name: 'John Miller',
      username: 'teacher',
      email: 'john@demo.edu',
      passwordHash,
      role: 'TEACHER',
    },
  })

  const teacherB = await prisma.user.create({
    data: {
      schoolId: school.id,
      name: 'Emily Davis',
      username: 'emily',
      email: 'emily@demo.edu',
      passwordHash,
      role: 'TEACHER',
    },
  })

  // 6. CREATE CLASSES & SECTIONS
  console.log('📚 Setting up curriculum...')
  const class10 = await prisma.class.create({
    data: { schoolId: school.id, name: 'Grade 10', sortOrder: 10 },
  })

  const sectionA = await prisma.section.create({
    data: { schoolId: school.id, classId: class10.id, name: 'A' },
  })

  // 7. CREATE SUBJECTS
  const subjectsData = [
    { name: 'Mathematics', code: 'MATH10', credit: 4, th: 75, pr: 25 },
    { name: 'Science', code: 'SCI10', credit: 4, th: 75, pr: 25 },
    { name: 'English', code: 'ENG10', credit: 4, th: 100, pr: 0 },
    { name: 'Social Studies', code: 'SOC10', credit: 4, th: 75, pr: 25 },
  ]

  const subjects = []
  for (const s of subjectsData) {
    const subject = await prisma.subject.create({
      data: {
        schoolId: school.id,
        name: s.name,
        code: s.code,
        creditHours: s.credit,
        theoryFullMarks: s.th,
        practicalFullMarks: s.pr,
        passPercentage: 40,
      }
    })
    subjects.push(subject)
  }

  // 8. ASSIGN TEACHERS
  await prisma.teacherAssignment.createMany({
    data: [
      { schoolId: school.id, teacherId: teacherA.id, classId: class10.id, sectionId: sectionA.id, subjectId: subjects[0].id },
      { schoolId: school.id, teacherId: teacherA.id, classId: class10.id, sectionId: sectionA.id, subjectId: subjects[1].id },
      { schoolId: school.id, teacherId: teacherB.id, classId: class10.id, sectionId: sectionA.id, subjectId: subjects[2].id },
    ]
  })

  // 9. CREATE STUDENTS
  console.log('👥 Onboarding students...')
  const names = ['Ethan Hunt', 'Jane Watson', 'Peter Parker', 'Bruce Wayne', 'Diana Prince']
  const students = []
  for (let i = 0; i < names.length; i++) {
    const student = await prisma.student.create({
      data: {
        schoolId: school.id,
        classId: class10.id,
        sectionId: sectionA.id,
        admissionNo: `GDX-2026-${100 + i}`,
        rollNo: `${i + 1}`,
        name: names[i],
        guardianName: 'Representative Guardian',
      }
    })
    students.push(student)
  }

  // 10. GRADING RULES
  console.log('📊 Setting grading rules...')
  const rules = [
    { label: 'A+', min: 90, max: 100, gpa: 4.0 },
    { label: 'A', min: 80, max: 89.99, gpa: 3.6 },
    { label: 'B+', min: 70, max: 79.99, gpa: 3.2 },
    { label: 'B', min: 60, max: 69.99, gpa: 2.8 },
    { label: 'C+', min: 50, max: 59.99, gpa: 2.4 },
    { label: 'C', min: 40, max: 49.99, gpa: 2.0 },
    { label: 'D', min: 35, max: 39.99, gpa: 1.6 },
    { label: 'NG', min: 0, max: 34.99, gpa: 0.0 },
  ]

  await prisma.gradeRule.createMany({
    data: rules.map((r, i) => ({
      schoolId: school.id,
      label: r.label,
      minPercentage: r.min,
      maxPercentage: r.max,
      gpa: r.gpa,
      sortOrder: i,
    }))
  })

  // 11. EXAMS & INITIAL MARKS
  console.log('✍️ Generating sample marks...')
  const midterm = await prisma.exam.create({
    data: { schoolId: school.id, name: 'First Terminal Examination' }
  })

  // Get the admin user we just created to be the "enteredBy" reference
  const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } })

  for (const subject of subjects) {
    await prisma.examSubject.create({
      data: { schoolId: school.id, examId: midterm.id, classId: class10.id, subjectId: subject.id }
    })

    // Add random marks for each student
    for (const student of students) {
      await prisma.mark.create({
        data: {
          schoolId: school.id,
          examId: midterm.id,
          studentId: student.id,
          subjectId: subject.id,
          theoryMarks: Math.floor(Math.random() * (subject.theoryFullMarks - 30) + 30),
          practicalMarks: subject.practicalFullMarks > 0 ? Math.floor(Math.random() * 10 + 15) : 0,
          enteredById: adminUser.id, // Fixed: Added required field
        }
      })
    }
  }

  console.log('\n✅ SEED COMPLETED SUCCESSFULLY')
  console.log('--------------------------------')
  console.log('Super Admin: superadmin / password123')
  console.log('Demo School Admin: admin / password123 (at /demo/login)')
  console.log('Demo Teacher: teacher / password123 (at /demo/login)')
  console.log('--------------------------------\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
