const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

interface MessageStats {
  messages: number;
  images: number;
}

interface Message {
  userId: string | null;
  aiModelId: string | null;
  metadata: any;
  isAIMessage: boolean;
}

async function updateStats() {
  try {
    console.log('Starting stats update...');



    // 2. Get all messages and count per user/AI model
    const messages = await prisma.message.findMany({
      select: {
        userId: true,
        aiModelId: true,
        metadata: true,
        isAIMessage: true
      }
    });

    // Use objects instead of Map for better iteration support
    const stats: Record<string, MessageStats> = {};
    const aiStats: Record<string, MessageStats> = {};

    // Count messages and images
    messages.forEach((msg: Message) => {
      // User stats
      if (msg.userId) {
        if (!stats[msg.userId]) {
          stats[msg.userId] = { messages: 0, images: 0 };
        }
        stats[msg.userId].messages++;
        if (msg.metadata && typeof msg.metadata === 'object' && 'type' in msg.metadata && msg.metadata.type === 'image') {
          stats[msg.userId].images++;
        }
      }

      // AI model stats
      if (msg.aiModelId && msg.isAIMessage) {
        if (!aiStats[msg.aiModelId]) {
          aiStats[msg.aiModelId] = { messages: 0, images: 0 };
        }
        aiStats[msg.aiModelId].messages++;
        if (msg.metadata && typeof msg.metadata === 'object' && 'type' in msg.metadata && msg.metadata.type === 'image') {
          aiStats[msg.aiModelId].images++;
        }
      }
    });

    // Update user stats in database
    console.log('\nUpdating user stats...');
    for (const [userId, userStats] of Object.entries(stats)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          messageCount: userStats.messages,
          imageCount: userStats.images
        }
      });
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      });
      console.log(`${user?.name} (${user?.email}):`, userStats);
    }

    // Update AI model stats in database
    console.log('\nUpdating AI model stats...');
    for (const [modelId, modelStats] of Object.entries(aiStats)) {
      await prisma.aIModel.update({
        where: { id: modelId },
        data: {
          messageCount: modelStats.messages,
          imageCount: modelStats.images
        }
      });
      const model = await prisma.aIModel.findUnique({
        where: { id: modelId },
        select: { name: true }
      });
      console.log(`${model?.name}:`, modelStats);
    }

    // Add random ages for all AI models
    console.log('\nAdding random ages to AI models...');
    const allModels = await prisma.aIModel.findMany();
    for (const model of allModels) {
      const randomAge = Math.floor(Math.random() * (30 - 18 + 1)) + 18;
      await prisma.aIModel.update({
        where: { id: model.id },
        data: {
          age: randomAge
        }
      });
      console.log(`Set age ${randomAge} for model: ${model.name}`);
    }

    console.log('\nStats update completed successfully!');
  } catch (error) {
    console.error('Error updating stats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateStats();