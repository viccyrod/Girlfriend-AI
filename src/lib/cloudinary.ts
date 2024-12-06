import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadBase64Image(base64Data: string) {
  try {
    // Check if the data is already in the correct format
    const formattedData = base64Data.startsWith('data:image') 
      ? base64Data 
      : `data:image/png;base64,${base64Data}`;

    const result = await cloudinary.uploader.upload(formattedData, {
      folder: 'ai-models',
      resource_type: 'auto'
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
} 