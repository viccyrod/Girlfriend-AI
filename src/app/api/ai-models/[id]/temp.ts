import { NextResponse } from "next/server";
import prisma from "@/lib/clients/prisma";
import { getDbUser } from '@/lib/actions/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const aiModel = await prisma.aIModel.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!aiModel) {
      return NextResponse.json(
        { error: 'AI Model not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(aiModel);
  } catch (error) {
    console.error('Error fetching AI model:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI model' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const data = await request.json();

    const updatedModel = await prisma.aIModel.update({
      where: { id, userId: currentUser.id },
      data: {
        name: data.name,
        personality: data.personality,
        appearance: data.appearance,
        backstory: data.backstory,
        hobbies: data.hobbies,
        likes: data.likes,
        dislikes: data.dislikes,
        isPrivate: data.isPrivate,
      },
    });

    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error('Error updating AI model:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const model = await prisma.aIModel.findUnique({
      where: { id, userId: currentUser.id },
    });

    if (!model) {
      return NextResponse.json({ error: 'AI Model not found or you do not have permission to delete it' }, { status: 404 });
    }

    await prisma.aIModel.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'AI Model deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI model:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 