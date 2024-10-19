import React from 'react'
import CoverImage from './CoverImage'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '../ui/button';
import Link from 'next/link';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';

const UserProfile = () => {
  const { user } = useKindeBrowserClient();

  if (!user) {
    return <div>Loading user profile...</div>;
  }

  return (
    <div className="flex flex-col">
      <CoverImage />
      <div className="flex flex-col p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <Avatar className='w-20 h-20 border-2 -mt-10'>
            <AvatarImage src={user.picture ?? ''} className='object-cover' />
            <AvatarFallback>{user.given_name?.[0]}{user.family_name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex">
            {!user.is_subscribed && (
              <Button asChild className="rounded-full flex gap-10">
                <Link href={"/pricing"}> 
                  <span className="uppercase font-semibold tracking-wide">Subscribe</span>
                </Link>
              </Button>
            )}
            {user.is_subscribed && (
              <Button className="rounded-full flex gap-10" variant="outline">
                <span className="uppercase font-semibold tracking-wide">Subscribed</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col mt-4">
          <p className="text-lg font-semibold">{user.given_name} {user.family_name}</p>
          <p className="text-sm mt-2 md:text-md">
            {user.bio || "No bio available."}
          </p>
        </div>
      </div>
      <div
      aria-hidden="true" className="h-2 w-full bg-muted"/>
    </div>
  )
}

export default UserProfile
