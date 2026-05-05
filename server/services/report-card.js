import PDFDocument from 'pdfkit'

export async function streamReportCard(res, { student, exam, summary }) {
  const doc = new PDFDocument({ margin: 48, size: 'A4' })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${student.admissionNo}-${exam.name}-report.pdf"`,
  )

  doc.pipe(res)
  doc.fontSize(20).text(student.school.name, { align: 'center' })
  doc.fontSize(14).text(`${exam.name} Report Card`, { align: 'center' })
  doc.moveDown()

  doc.fontSize(11)
  doc.text(`Student: ${student.name}`)
  doc.text(`Admission No: ${student.admissionNo}`)
  doc.text(`Class: ${student.class.name}${student.section ? ` - ${student.section.name}` : ''}`)
  doc.text(`Roll No: ${student.rollNo}`)
  if (student.dobAd || student.dobBs) {
    doc.text(`DOB (AD): ${student.dobAd ?? '-'}`)
    doc.text(`DOB (BS): ${student.dobBs ?? '-'}`)
  }
  doc.moveDown()

  const startX = 48
  let y = doc.y
  const columns = [startX, 190, 260, 335, 410, 470]
  const headers = ['Subject', 'Theory', 'Practical', 'Grade', 'GPA', 'Remarks']

  doc.font('Helvetica-Bold')
  headers.forEach((header, index) => doc.text(header, columns[index], y, { width: 90 }))
  y += 22
  doc.moveTo(startX, y - 6).lineTo(545, y - 6).stroke()
  doc.font('Helvetica')

  summary.subjects.forEach((result) => {
    if (y > 730) {
      doc.addPage()
      y = 48
    }

    doc.text(result.subject.name, columns[0], y, { width: 135 })
    doc.text(result.theoryGrade ?? '-', columns[1], y, { width: 60 })
    doc.text(result.practicalGrade ?? '-', columns[2], y, { width: 70 })
    doc.text(result.finalGrade ?? '-', columns[3], y, { width: 60 })
    doc.text(String(result.finalGpa ?? '-'), columns[4], y, { width: 50 })
    doc.text(result.remarks ?? '-', columns[5], y, { width: 75 })
    y += 24
  })

  doc.moveDown(2)
  doc.font('Helvetica-Bold').fontSize(13).text(`Final GPA: ${summary.finalGpa}`)
  doc.text(`Status: ${summary.status}`)
  doc.end()
}
