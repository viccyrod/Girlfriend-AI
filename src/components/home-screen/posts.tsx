"use client"

import React, { useEffect, useState } from 'react'
import Post from './post'
// import { Skeleton } from '../ui/skeleton'
import PostSkeleton from '../skeletons/PostSkeleton'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { User } from '@/types/user';


// Define the Post interface
interface Post {
    id: string;
    text: string;
    isPublic: boolean;
    mediaUrl?: string;
    mediaType?: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    author: User;
    // Add other properties of a post here
  }
const Posts = () => {
    const { user, isLoading: isUserLoading } = useKindeBrowserClient();
    const [postsData, setPostsData] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const admin: User | null = user as User | null;

    // Update the type guard function
    const isSubscribed = (user: User | null): boolean => {
        if (!user) return false;
        return 'is_subscribed' in user ? user.is_subscribed : false;
    };

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch('/api/posts'); // Replace with your actual API endpoint
                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }
                const data = await response.json();
                setPostsData(data);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (isUserLoading) {
        return <div>Loading user data...</div>
    }

    if (isLoading) {
        return (
            <div className="mt-10 px-3 flex flex-col gap-10">
                {[...Array(3)].map((_, index) => (
                    <PostSkeleton key={index} />
                ))}
            </div>
        )
    }

    if (error) {
        return <div className="mt-10 px-3">Error: {error}</div>
    }

    return (
        <div>
            {postsData.length > 0 ? (
                postsData.map(post => (
                    <Post 
                        key={post.id} 
                        post={post} 
                        admin={{
                            id: admin?.id?.toString() ?? '',
                            name: admin?.name ?? '',
                            // Include other required fields with fallback values
                        }}
                        isSubscribed={isSubscribed(user as User | null)}
                        user={user ?? {id: ''}} 
                    />
                ))
            ) : (
                <div className="mt-10 px-3">
                    <div className="flex flex-col items-center space-y-3 w-full">
                        <span className="text-lg font-semibold">No posts yet</span>
                        <span className="text-sm text-muted-foreground">
                            Stay tuned for more posts from this creator.
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Posts
