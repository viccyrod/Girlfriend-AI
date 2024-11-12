import prisma from '@/lib/clients/prisma';

export async function addImageToAIModel(
  aiModelId: string, 
  imageUrl: string, 
  imageData?: string,
  isNSFW: boolean = false
) {
  return prisma.image.create({
    data: {
      imageUrl,
      imageData,
      isNSFW,
      aiModelId
    }
  });
}

export async function getAIModelImages(aiModelId: string) {
  return prisma.image.findMany({
    where: { aiModelId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function removeImage(imageId: string) {
  return prisma.image.delete({
    where: { id: imageId }
  });
} 