import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import { prisma } from './db.js'
import { env } from './env.js'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'
import studentRoutes from './routes/student.js'
import superAdminRoutes from './routes/super-admin.js'
import teacherRoutes from './routes/teacher.js'
import settingsRoutes from './routes/settings.js'
import publicRoutes from './routes/public.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(morgan(env.isProduction ? 'combined' : 'dev'))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'gradex-api' })
})

app.use('/api/auth', authRoutes)
app.use('/api/super-admin', superAdminRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin/settings', settingsRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/public', publicRoutes)

app.use((err, _req, res, _next) => {
  const status = err.status ?? 500
  const message = status === 500 ? 'Internal server error' : err.message

  if (status === 500) {
    console.error(err)
  }

  res.status(status).json({ error: message })
})

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(env.port, () => {
    console.log(`Gradex API listening on http://localhost:${env.port}`)
  })
}

export default app
