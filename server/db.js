import 'dotenv/config'
import { neonConfig } from '@neondatabase/serverless'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Add your Neon connection string to .env.')
}

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
})

export const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === 'production'
      ? ['error']
      : ['query', 'warn', 'error'],
})
