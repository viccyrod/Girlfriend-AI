// Client-side component
"use client";

// Import necessary libraries and components
import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { user } from '@/dummy_data';
import { ChatBubbleIcon, HeartFilledIcon, HeartIcon, LockClosedIcon, TrashIcon } from '@radix-ui/react-icons';
import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '../../ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Define the props for the Post component
interface PostProps {
  post: {
    id: string;
    text: string;
    mediaUrl?: string;
    mediaType?: string;
    likes: number;
    isLikedByUser: boolean;
    createdAt: string;
    isPublic: boolean; // Add this line
  };
  isSubscribed: boolean;
  admin: {
    id: string;
    name: string;
    image?: string;
  };
}

// Post component to render a social media post
const Post: React.FC<PostProps> = ({ post, isSubscribed, admin }) => {
  // State to manage if the post is liked by the user
  const [isLiked, setIsLiked] = useState(post.isLikedByUser);
  // React Query client for cache management
  const queryClient = useQueryClient();

  // Mutation for liking a post
  const likeMutation = useMutation({
    // Function to handle the like API call
    mutationFn: async () => {
      const response = await fetch('/api/posts/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: post.id }),
      });
      if (!response.ok) {
        throw new Error('Failed to like post');
      }
      return response.json();
    },
    // On success, invalidate the 'posts' query to refresh the data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Handle the like button click
  const handleLike = () => {
    setIsLiked(!isLiked); // Optimistically update the like state
    likeMutation.mutate(); // Trigger the mutation
  };
  
  return (
    <div className="flex flex-col gap-3 p-3 border-t">
      {/* Post Header: Admin info and post date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={admin.image || "/user-placeholder.png"}/>
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm md:text-sm">{admin.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-zinc-400 text-xs md:text-sm tracking-tighter">
            16.10.2024
          </p>
          {/* Trash icon for deleting the post (only visible if the user is the admin) */}
          {admin.id === String(user.id) && (
            <TrashIcon className="w-5 h-5 text-muted-foreground hover:text-red-500 cursor-pointer" />
          )}
        </div>
      </div>
      
      {/* Post Content: Text and Media */}
      <p className="text-sm md:text-ms">{post.text}</p>

      {/* Display post image if the post is public or the user is subscribed */}
      {(post.isPublic || isSubscribed) && post.mediaUrl && post.mediaType === "image" && (
        <div className="relative w-full aspect-video">
          <Image 
            src={post.mediaUrl} 
            alt="Post Image" 
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        </div>
      )}
      
      {/* Display locked content message if the user is not subscribed */}
      {!isSubscribed && !post.isPublic && (
        <div className="w-full bg-slate-800 relative h-96 rounded-md flex flex-col justify-center items-center px-5 !bg-gf overflow-hidden">
          <LockClosedIcon className="w-10 h-16 text-zinc-400 mb-20 z-0" /> 
          <div aria-hidden="true" className="absolute w-full h-full bg-black opacity-50 z-0" />
          <span className="text-muted-foreground text-sm">This post is private, you need to be subscribed to see it</span>
          <Link
            className={buttonVariants({
              className: "!rounded-full w-full font-bold text-white",
            })}
            href={"/pricing"}
          >
            Subscribe to unlock
          </Link>
        </div>
      )}
      
      {/* Post Actions: Like and Comment buttons */}
      <div className='flex gap-4'>
        {/* Like Button */}
        <div className='flex gap-1 items-center'>
          {isLiked ? (
            <HeartFilledIcon 
              className='w-5 h-5 cursor-pointer text-red-500'
              onClick={handleLike}  
            />
          ) : (
            <HeartIcon 
              className='w-5 h-5 cursor-pointer text-zinc-400 hover:text-red-500'
              onClick={handleLike}  
            />
          )}
          <span className='text-xs text-zinc-400 tracking-tighter'>{post.likes}</span>
        </div>
        {/* Comment Button */}
        <div className='flex gap-1 items-center'>
          <ChatBubbleIcon className='w-5 h-5 cursor-pointer' />
          <span className='text-xs text-zinc-400 tracking-tighter'>55</span>
        </div>
      </div>
    </div>
  );
};

export default Post;
