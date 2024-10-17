import { NextResponse } from 'next/server'
import prisma from '@/db/prisma'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

export async function GET() {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isSubscribed: true,
        // Add other fields you want to return
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(dbUser)
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
  }
}

