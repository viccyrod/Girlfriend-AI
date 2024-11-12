import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      }
    }
  }).$extends({
    query: {
      $allOperations({ operation, model, args, query }) {
        console.log(`[Prisma Debug] ${model}.${operation}`, { 
          timestamp: new Date().toISOString(),
          args 
        });
        return query(args);
      },
    },
  });
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

// Test database connection
prisma.$connect()
  .then(() => console.log('Database connected successfully'))
  .catch((e) => {
    console.error('Database connection failed', e)
    console.error('DATABASE_URL:', process.env.DATABASE_URL)
  })

  