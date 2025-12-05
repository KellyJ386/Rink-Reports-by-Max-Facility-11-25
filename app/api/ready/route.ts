import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Readiness check - is the app ready to receive traffic?
export async function GET() {
  try {
    // Check database is accessible
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      { ready: true, timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        ready: false,
        error: error instanceof Error ? error.message : 'Service not ready',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
