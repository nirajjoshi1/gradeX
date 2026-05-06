import { prisma } from '../db.js'

const number = (value) => (value == null ? 0 : Number(value))

export function findGrade(percentage, rules) {
  return (
    rules.find((rule) => {
      const min = Number(rule.minPercentage)
      const max = Number(rule.maxPercentage)
      return percentage >= min && percentage <= max
    }) ?? null
  )
}

export function calculateSubjectResult(mark, subject, rules) {
  const theoryFull = number(subject.theoryFullMarks)
  const practicalFull = number(subject.practicalFullMarks)
  const theoryMarks = number(mark.theoryMarks)
  const practicalMarks = number(mark.practicalMarks)
  const fullMarks = theoryFull + practicalFull

  if (mark.isAbsent) {
    return {
      theoryGrade: null,
      theoryGpa: null,
      practicalGrade: null,
      practicalGpa: null,
      finalPercentage: 0,
      finalGrade: 'ABS',
      finalGpa: 0,
      weightedGpa: 0,
      status: 'ABSENT',
      remarks: mark.remarks ?? 'Absent',
    }
  }

  const theoryPercentage = theoryFull > 0 ? (theoryMarks / theoryFull) * 100 : null
  const practicalPercentage =
    practicalFull > 0 ? (practicalMarks / practicalFull) * 100 : null
  const finalPercentage = fullMarks > 0 ? ((theoryMarks + practicalMarks) / fullMarks) * 100 : 0
  const theoryGrade = theoryPercentage == null ? null : findGrade(theoryPercentage, rules)
  const practicalGrade =
    practicalPercentage == null ? null : findGrade(practicalPercentage, rules)
  const finalGrade = findGrade(finalPercentage, rules)
  const isPass =
    finalGrade &&
    finalPercentage >= number(subject.passPercentage) &&
    (theoryFull === 0 || theoryMarks <= theoryFull) &&
    (practicalFull === 0 || practicalMarks <= practicalFull)

  return {
    theoryGrade: theoryGrade?.label ?? null,
    theoryGpa: theoryGrade ? Number(theoryGrade.gpa) : null,
    practicalGrade: practicalGrade?.label ?? null,
    practicalGpa: practicalGrade ? Number(practicalGrade.gpa) : null,
    finalPercentage,
    finalGrade: finalGrade?.label ?? 'N/A',
    finalGpa: finalGrade ? Number(finalGrade.gpa) : 0,
    weightedGpa: (finalGrade ? Number(finalGrade.gpa) : 0) * number(subject.creditHours),
    status: isPass ? 'PASS' : 'FAIL',
    remarks: mark.remarks || finalGrade?.remarks || (isPass ? 'Pass' : 'Fail'),
  }
}

export async function calculateAndCacheStudentExam({ schoolId, examId, studentId }) {
  const [rules, marks] = await Promise.all([
    prisma.gradeRule.findMany({
      where: { schoolId },
      orderBy: [{ sortOrder: 'asc' }, { minPercentage: 'desc' }],
    }),
    prisma.mark.findMany({
      where: { schoolId, examId, studentId },
      include: { subject: true },
    }),
  ])

  let weightedTotal = 0
  let creditTotal = 0

  const subjects = await Promise.all(
    marks.map(async (mark) => {
      const calculated = calculateSubjectResult(mark, mark.subject, rules)
      const creditHours = number(mark.subject.creditHours)
      weightedTotal += calculated.finalGpa * creditHours
      creditTotal += creditHours

      const result = await prisma.result.upsert({
        where: {
          examId_studentId_subjectId: {
            examId,
            studentId,
            subjectId: mark.subjectId,
          },
        },
        update: {
          ...calculated,
          calculatedAt: new Date(),
        },
        create: {
          schoolId,
          examId,
          studentId,
          subjectId: mark.subjectId,
          ...calculated,
        },
        include: { subject: true },
      })

      return result
    }),
  )

  return {
    subjects,
    finalGpa: creditTotal > 0 ? Number((weightedTotal / creditTotal).toFixed(2)) : 0,
    status: subjects.some((subject) => subject.status !== 'PASS') ? 'FAIL' : 'PASS',
  }
}

export async function getCachedStudentExamSummary({ schoolId, examId, studentId }) {
  const subjects = await prisma.result.findMany({
    where: { schoolId, examId, studentId },
    include: { subject: true },
    orderBy: { subject: { name: 'asc' } },
  })

  if (!subjects.length) {
    return null
  }

  let weightedTotal = 0
  let creditTotal = 0

  subjects.forEach((subject) => {
    const creditHours = number(subject.subject.creditHours)
    weightedTotal += number(subject.finalGpa) * creditHours
    creditTotal += creditHours
  })

  return {
    subjects,
    finalGpa: creditTotal > 0 ? Number((weightedTotal / creditTotal).toFixed(2)) : 0,
    status: subjects.some((subject) => subject.status !== 'PASS') ? 'FAIL' : 'PASS',
  }
}

export async function calculateExamResults({ schoolId, examId }) {
  const students = await prisma.student.findMany({
    where: {
      schoolId,
      marks: { some: { examId } },
    },
    select: { id: true },
  })

  return Promise.all(
    students.map((student) =>
      calculateAndCacheStudentExam({ schoolId, examId, studentId: student.id }),
    ),
  )
}
