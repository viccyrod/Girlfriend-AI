import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/actions/server/auth'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST() {
  const currentUser = await getDbUser();

  return NextResponse.json(
    { error: 'Training not implemented yet' },
    { status: 501 }
  )
}
