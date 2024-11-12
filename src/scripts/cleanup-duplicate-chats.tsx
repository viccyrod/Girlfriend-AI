import prisma from '../lib/clients/prisma'

async function cleanupDuplicateChats() {
  try {
    // Get all users
    const users = await prisma.user.findMany();

    for (const user of users) {
      // Get all AI models
      const aiModels = await prisma.aIModel.findMany();

      for (const aiModel of aiModels) {
        // Find all chat rooms between this user and AI model
        const chatRooms = await prisma.chatRoom.findMany({
          where: {
            aiModelId: aiModel.id,
            users: {
              some: {
                id: user.id
              }
            }
          },
          include: {
            messages: true
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });

        if (chatRooms.length > 1) {
          // Keep the most recently updated chat room
          const [keepRoom, ...duplicateRooms] = chatRooms;
          
          // Merge messages into the kept room
          for (const room of duplicateRooms) {
            await prisma.message.updateMany({
              where: {
                chatRoomId: room.id
              },
              data: {
                chatRoomId: keepRoom.id
              }
            });
          }

          // Delete the duplicate rooms
          await prisma.chatRoom.deleteMany({
            where: {
              id: {
                in: duplicateRooms.map(room => room.id)
              }
            }
          });

          console.log(`Merged ${duplicateRooms.length} duplicate rooms for user ${user.id} and AI ${aiModel.id}`);
        }
      }
    }

    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Add these lines at the end of the file
cleanupDuplicateChats()
  .catch((error) => {
    console.error('Failed to run cleanup:', error);
    process.exit(1);
  });
