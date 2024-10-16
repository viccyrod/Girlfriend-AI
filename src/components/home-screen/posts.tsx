import React from 'react'
import Post from './post'
import { Skeleton } from '../ui/skeleton'
import PostSkeleton from '../skeletons/PostSkeleton'
import { admin, user } from '@/dummy_data'

const posts = () => {
    
    const isLoading = true
  return (
    <div>

    {!isLoading && posts.map(post =>
        <Post key={post.id} post={post} admin={admin} isSubscribed={user.isSubscribed}/>
    )}

        {isLoading && (
            <div className="mt-10 px-3 flex flex-col gap-10">
                {[...Array(3)].map( (_, index) => (
                    <PostSkeleton key={index} />
                ))}
            </div>
        )}
        {!isLoading && posts.length === 0 && (
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

export default posts