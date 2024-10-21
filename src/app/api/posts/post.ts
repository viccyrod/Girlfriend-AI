import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Make sure you import your Prisma client correctly

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const posts = await prisma.post.findMany({
                include: {
                    author: true,
                    comments: true,
                }
            });
            res.status(200).json(posts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            res.status(500).json({ error: 'Error fetching posts' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
