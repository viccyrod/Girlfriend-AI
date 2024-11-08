// This code defines an API endpoint that handles DELETE requests to delete a specific message.
// It checks if the user is authenticated and authorized to delete the message, and then deletes it from the database.

// Importing necessary modules and functions from external libraries
import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { getCurrentUser } from '@/lib/session';

// Handles DELETE requests to delete a specific message by its ID
export async function DELETE(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  // Fetch the current user to ensure they are authenticated
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    // If the user is not authenticated, return a 401 Unauthorized response
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const messageId = params.messageId;

  try {
    // Find the message in the database by its ID
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    // If the message does not exist, return a 404 Not Found response
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if the current user is the owner of the message
    if (message.userId !== currentUser.id) {
      // If the user is not the owner, return a 403 Forbidden response
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the message from the database
    await prisma.message.delete({
      where: { id: messageId },
    });

    // Return a success response after successful deletion
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete message:', error);
    // If an error occurs during deletion, return a 500 Internal Server Error response
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
