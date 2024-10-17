import React from 'react'
import Post from './post'
import PostSkeleton from '../../skeletons/PostSkeleton'
import { admin as adminData, user, posts as postsData } from '@/dummy_data'

// Define an interface for the post data structure
interface PostData {
  id: number;
  text: string;
  mediaType: string;
  mediaUrl: string;
  likes: number;
  isPublic: boolean;
  createdAt: Date;
  comments: Array<{
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
      image: string;
    };
    content: string;
    createdAt: Date;
  }>;
}

// Transform the post data to match the expected shape
const transformPost = (post: PostData) => ({
  id: String(post.id),
  text: post.text,
  mediaUrl: post.mediaUrl,
  mediaType: post.mediaType,
  likes: post.likes,
  isLikedByUser: false, // Add this property with a default value
  createdAt: post.createdAt.toISOString(),
  isPublic: post.isPublic,
})

const admin = {
  ...adminData,
  id: String(adminData.id)
}

const Posts = () => {
    
    const isLoading = false
  return (
    <div>

    {!isLoading && postsData.map(post =>
        <Post key={post.id.toString()} post={transformPost(post)} admin={admin} isSubscribed={user.isSubscribed}/>
    )}

        {isLoading && (
            <div className="mt-10 px-3 flex flex-col gap-10">
                {[...Array(3)].map( (_, index) => (
                    <PostSkeleton key={index} />
                ))}
            </div>
        )}
        {!isLoading && postsData.length === 0 && (
            <div className="mt-10 px-3">
                <div className="flex flex-col items-center space-y-3 w-full">
                    <span className="text-lg font-semibold">No posts yet</span>
                    <span className="text-sm text-muted-foreground">
                        Stay tuned for more posts for more posts from this creator.
                    </span>
                </div>
            </div>
            )}
    </div>
  )
}

export default Posts
