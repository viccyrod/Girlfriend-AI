import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/lib/clients/prisma";

export async function getChatRoomMessagesServer(chatRoomId: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) {
    throw new Error("Unauthorized");
  }

  const messages = await prisma.message.findMany({
    where: {
      chatRoomId: chatRoomId,
    },
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      user: true,
    },
  });

  return messages;
}

// Add other server-side actions here
