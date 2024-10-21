"use client";

import React, { Suspense } from 'react';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { User } from '@/types/user';
import CoverImage from './CoverImage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import Link from 'next/link';

const UserProfile = () => {
  const { user: kindeUser } = useKindeBrowserClient();

  if (!kindeUser) {
    return <div>Loading user profile...</div>;
  }

  const user: User = {
    id: kindeUser.id || '',
    name: `${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim(),
    email: kindeUser.email || '',
    image: kindeUser.picture || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bio: '',
    is_subscribed: false
  };

  return (
    <div className="flex flex-col">
      <Suspense fallback={<div>Loading cover image...</div>}>
        <CoverImage />
      </Suspense>
      <div className="flex flex-col p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <UserAvatar user={user} />
          <SubscriptionButton user={user} />
        </div>
        <UserInfo user={user} />
      </div>
      <div
      aria-hidden="true" className="h-2 w-full bg-muted"/>
    </div>
  )
}

const UserAvatar: React.FC<{ user: User }> = ({ user }) => (
  <Avatar className="w-20 h-20 border-2 -mt-10">
    <AvatarImage src={user.image ?? ''} alt={`${user.name}'s avatar`} className="object-cover" />
    <AvatarFallback>{user.name?.[0]}{user.name?.[1]}</AvatarFallback>
  </Avatar>
)

const SubscriptionButton: React.FC<{ user: User }> = ({ user }) => (
  <div className="flex">
    {!user.is_subscribed ? (
      <Button asChild className="rounded-full">
        <Link href="/pricing">
          <span className="uppercase font-semibold tracking-wide">Subscribe</span>
        </Link>
      </Button>
    ) : (
      <Button className="rounded-full" variant="outline">
        <span className="uppercase font-semibold tracking-wide">Subscribed</span>
      </Button>
    )}
  </div>
)

const UserInfo: React.FC<{ user: User }> = ({ user }) => (
  <div className="flex flex-col mt-4">
    <p className="text-lg font-semibold">{user.name}</p>
    <p className="text-sm mt-2 md:text-md">
      {user.bio || "No bio available."}
    </p>
  </div>
)

export default UserProfile
