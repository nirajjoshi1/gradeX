import PDFDocument from 'pdfkit'
import axios from 'axios'

export async function streamReportCard(res, { student, exam, summary }) {
  const doc = new PDFDocument({ 
    margin: 40, 
    size: 'A4',
    info: { Title: `Report Card - ${student.name}` }
  })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${student.admissionNo}-${exam.name}-report.pdf"`,
  )

  doc.pipe(res)

  const blue = '#1e293b'
  const lightBlue = '#f1f5f9'
  const accent = '#3b82f6'

  // --- HEADER SECTION ---
  // Draw top background shape (right side accent)
  doc.save()
  doc.path('M 400 40 L 555 40 L 555 100 L 450 100 Z').fill(blue)
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('ACADEMIC YEAR', 455, 55, { align: 'center', width: 100 })
  doc.fontSize(16).text('2024-25', 455, 70, { align: 'center', width: 100 })
  doc.restore()

  // School Logo
  if (student.school.logoUrl) {
    try {
      const response = await axios.get(student.school.logoUrl, { responseType: 'arraybuffer' })
      doc.image(response.data, 45, 45, { height: 70 })
    } catch (err) {
      console.error('Logo error:', err.message)
    }
  }

  // School Info
  doc.fillColor(blue).font('Helvetica-Bold').fontSize(24).text(student.school.name.toUpperCase(), 130, 45)
  doc.font('Helvetica').fontSize(10).fillColor('#64748b').text(student.school.address || '', 130, 72)
  doc.moveDown(1.5)
  doc.font('Helvetica-Bold').fontSize(28).fillColor(blue).text('REPORT CARD', 130, 100)
  doc.rect(130, 132, 80, 4).fill(accent)

  doc.moveDown(4)

  // --- STUDENT INFO GRID ---
  const gridY = 160
  const col1 = 50
  const col2 = 320

  const drawInfoItem = (label, value, x, y) => {
    doc.fillColor('#64748b').font('Helvetica').fontSize(10).text(label, x, y)
    doc.fillColor(blue).font('Helvetica-Bold').fontSize(10).text(`:  ${value}`, x + 90, y)
    doc.moveTo(x, y + 14).lineTo(x + 240, y + 14).lineWidth(0.5).strokeColor('#e2e8f0').stroke()
  }

  drawInfoItem('Student Name', student.name, col1, gridY)
  drawInfoItem('Roll Number', student.rollNo, col2, gridY)
  drawInfoItem('Class / Section', `${student.class.name}${student.section ? ` - ${student.section.name}` : ''}`, col1, gridY + 25)
  drawInfoItem('Term', exam.name, col2, gridY + 25)
  drawInfoItem('Admission No.', student.admissionNo, col1, gridY + 50)
  drawInfoItem('Date of Issue', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), col2, gridY + 50)

  doc.moveDown(6)

  // --- SUBJECT PERFORMANCE TABLE ---
  const tableTop = 260
  doc.rect(40, tableTop, 515, 25).fill(blue)
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text('SUBJECT-WISE PERFORMANCE', 50, tableTop + 7)

  // Table Headers
  const yH = tableTop + 35
  doc.fillColor(blue).fontSize(8)
  const cols = [50, 200, 260, 320, 380, 450]
  const widths = [150, 60, 60, 60, 70, 100]
  const headers = ['SUBJECT', 'THEORY', 'PRACTICAL', 'FINAL GRADE', 'GPA', 'REMARKS']

  doc.rect(40, yH - 5, 515, 20).fill(lightBlue)
  headers.forEach((h, i) => {
    const align = i === 0 ? 'left' : 'center'
    doc.fillColor(blue).text(h, cols[i], yH, { width: widths[i], align })
  })

  let currentY = yH + 20
  doc.font('Helvetica').fontSize(9)

  summary.subjects.forEach((item, index) => {
    // Zebra striping
    if (index % 2 === 0) {
      doc.rect(40, currentY - 5, 515, 20).fill('#f8fafc')
    }
    
    doc.fillColor(blue)
    doc.text(item.subject.name, cols[0], currentY, { width: widths[0], align: 'left' })
    doc.text(item.theoryGrade || '-', cols[1], currentY, { align: 'center', width: widths[1] })
    doc.text(item.practicalGrade || '-', cols[2], currentY, { align: 'center', width: widths[2] })
    doc.font('Helvetica-Bold').text(item.finalGrade || '-', cols[3], currentY, { align: 'center', width: widths[3] })
    doc.font('Helvetica').text(String(item.finalGpa || '-'), cols[4], currentY, { align: 'center', width: widths[4] })
    doc.text(item.remarks || '-', cols[5], currentY, { width: widths[5], align: 'center' })

    currentY += 20
    doc.moveTo(40, currentY - 5).lineTo(555, currentY - 5).lineWidth(0.2).strokeColor('#e2e8f0').stroke()
  })

  // --- SUMMARY BAR ---
  doc.moveDown(2)
  const summaryY = doc.y
  doc.rect(40, summaryY, 515, 45).fill(lightBlue)
  
  const drawSummaryItem = (label, value, x) => {
    doc.fillColor(accent).font('Helvetica-Bold').fontSize(8).text(label.toUpperCase(), x, summaryY + 10, { align: 'center', width: 100 })
    doc.fillColor(blue).fontSize(14).text(value, x, summaryY + 22, { align: 'center', width: 100 })
  }

  drawSummaryItem('Overall Grade', summary.status === 'FAILED' ? 'N/A' : summary.finalGrade, 150)
  drawSummaryItem('Grade Point Average', summary.finalGpa, 270)
  drawSummaryItem('Status', summary.status, 390)

  // --- FOOTER SIGNATURES ---
  const footerY = 740
  const drawSignature = (label, x, imgUrl) => {
    if (imgUrl) {
      try {
        // We handle this outside because of the async nature
      } catch (err) {}
    }
    doc.moveTo(x, footerY).lineTo(x + 120, footerY).strokeColor(blue).lineWidth(1).stroke()
    doc.fillColor(blue).font('Helvetica').fontSize(10).text(label, x, footerY + 8, { width: 120, align: 'center' })
  }

  drawSignature('Class Teacher', 50)
  drawSignature('Head of School', 237)
  drawSignature('Parent / Guardian', 425)

  // Overlay the Principal Signature image if available
  if (student.school.signatureUrl) {
    try {
      const sigResponse = await axios.get(student.school.signatureUrl, { responseType: 'arraybuffer' })
      doc.image(sigResponse.data, 247, footerY - 50, { width: 100 })
    } catch (err) {
      console.error('Signature error:', err.message)
    }
  }

  doc.end()
}
