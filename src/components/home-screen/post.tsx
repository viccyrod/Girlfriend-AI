"use client"

import React, { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ChatBubbleIcon, HeartFilledIcon, HeartIcon, LockClosedIcon, TrashIcon } from '@radix-ui/react-icons'
import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from '../ui/button'

// Define a proper interface for the post object
interface PostType {
  text: string;
  isPublic: boolean;
  mediaUrl?: string;
  mediaType?: string;
}

// Define a proper interface for the admin object
interface AdminType {
  id: string;
  name: string;
  image?: string;
}

// Add user to the component props and its type definition
interface UserType {
  id: string;
}

const Post = ({post, isSubscribed, admin, user}: {
  post: PostType, 
  isSubscribed: boolean, 
  admin: AdminType,
  user: UserType
}) => {
  const [isLiked, setIsLiked] = useState(false)
  
  return (
    <div className="flex flex-col gap-3 p-3 border-t">
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
          {admin.id === String(user.id) && (
            <TrashIcon className="w-5 h-5 text-muted-foreground hover:text-red-500 cursor-pointer" />
          )}
        </div>
      </div>
      
      <p className="text-sm md:text-ms">{post.text}</p>

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
      
      <div className='flex gap-4'>
        <div className='flex gap-1 items-center'>
          {isLiked ? (
            <HeartFilledIcon 
              className='w-5 h-5 cursor-pointer text-red-500'
              onClick={() => setIsLiked(false)}  
            />
          ) : (
            <HeartIcon 
              className='w-5 h-5 cursor-pointer text-zinc-400 hover:text-red-500'
              onClick={() => setIsLiked(true)}  
            />
          )}
          <span className='text-xs text-zinc-400 tracking-tighter'>55</span>
        </div>
        <div className='flex gap-1 items-center'>
          <ChatBubbleIcon className='w-5 h-5 cursor-pointer' />
          <span className='text-xs text-zinc-400 tracking-tighter'>55</span>
        </div>
      </div>
    </div>
  )
}

export default Post
