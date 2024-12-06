/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'res.cloudinary.com',
      pathname: '**',
    }],
    domains: ['localhost', 'girlfriendcx.kinde.com', 'www.girlfriend.cx'],
  },
  env: {
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
};

export default nextConfig;
