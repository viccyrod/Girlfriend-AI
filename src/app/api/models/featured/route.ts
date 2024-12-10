import { NextResponse } from "next/server";
import prisma from "@/lib/clients/prisma";

export async function GET() {
  try {
    const models = await prisma.aIModel.findMany({
      where: {
        isPrivate: false,
        isAnime: false
      },
      select: {
        id: true,
        name: true,
        personality: true,
        imageUrl: true,
        followerCount: true,
        createdBy: {
          select: {
            name: true,
            id: true,
          }
        }
      },
      orderBy: {
        followerCount: 'desc'
      },
      take: 8,
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching featured models:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
} 