import { v2 as cloudinary } from 'cloudinary';
import prisma from '@/lib/clients/prisma';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const defaultModels = [
  { name: 'Isabella', path: '/ai-models/India/india.jpeg' },
];

async function uploadDefaultImages() {
  try {
    for (const model of defaultModels) {
      const imagePath = path.join(process.cwd(), 'public', model.path);
      
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(imagePath, {
        folder: 'ai-models',
        public_id: model.name.toLowerCase(),
      });

      // Update the model in the database with the new image URL
      await prisma.aIModel.updateMany({
        where: {
          name: model.name,
        },
        data: {
          imageUrl: result.secure_url,
        },
      });

      console.log(`✅ Uploaded ${model.name}'s image to Cloudinary: ${result.secure_url}`);
    }

    console.log('✨ All default images uploaded successfully!');
  } catch (error) {
    console.error('Error uploading images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
uploadDefaultImages(); 