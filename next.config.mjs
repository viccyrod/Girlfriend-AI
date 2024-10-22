/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'res.cloudinary.com' , 'girlfriendcx.kinde.com', 'www.girlfriend.cx'], // Add Cloudinary domain if you're using it
  },
  env: {
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },
  // Add any other necessary configurations here
};

export default nextConfig;
