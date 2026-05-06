import express from 'express'
import nodemailer from 'nodemailer'
import { env } from '../env.js'

const router = express.Router()

// Simple email validation regex
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Contact form inquiry endpoint
router.post('/inquiry', async (req, res) => {
  const { name, email, message } = req.body

  // 🔴 Validation
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields before submitting the form.'
    })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.'
    })
  }

  const targetEmail = env.emailUser

  try {
    // 📩 Transporter (secure via .env)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.emailUser,
        pass: env.emailPass
      }
    })

    // ✉️ Send Email
    await transporter.sendMail({
      from: `"GradeX Lead" <${targetEmail}>`,
      to: targetEmail,
      subject: `🚀 New School Inquiry from ${name}`,
      replyTo: email,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px;">
          <h2 style="color: #4F46E5;">New Inquiry Received via GradeX</h2>
          <hr />
          <p><strong>Sender Name:</strong> ${name}</p>
          <p><strong>Sender Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Message:</strong></p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5;">
            ${message}
          </div>
          <br />
          <p style="font-size: 12px; color: #999;">
            This is an automated lead notification from your GradeX Landing Page.
          </p>
        </div>
      `
    })

    console.log('✅ Email sent successfully to', targetEmail)
    console.log('📬 INQUIRY DETAILS:', { name, email, message })

    // 🟢 Success Response
    return res.status(200).json({
      success: true,
      message: '🎉 Your message has been received! Our team will contact you shortly.'
    })

  } catch (error) {
    console.error('❌ Failed to send email:', error)

    // 🔴 Error Response
    return res.status(500).json({
      success: false,
      message: 'Unable to send your message right now. Please try again in a moment.'
    })
  }
})

export default router