import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json(
    { error: 'Training not implemented yet' },
    { status: 501 }
  )
}
