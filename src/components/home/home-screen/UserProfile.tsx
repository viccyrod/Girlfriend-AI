import React from 'react'
import CoverImage from './CoverImage'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '../../ui/button';
import Link from 'next/link';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"

// Define the props interface for UserProfile
interface UserProfileProps {
  user: {
    id: string;
    name: string;
    image?: string;
    isSubscribed: boolean;
    bio?: string;
  }
}

// UserProfile component to display user information
const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const { user: loggedInUser } = useKindeBrowserClient()

  // Function to determine which button to display
  const renderActionButton = () => {
    if (loggedInUser?.id === user.id) {
      return (
        <Button asChild className="rounded-full flex gap-10">
          <Link href="/profile/edit">
            <span className="uppercase font-semibold tracking-wide">Edit Profile</span>
          </Link>
        </Button>
      )
    } else if (user.isSubscribed) {
      return (
        <Button className="rounded-full flex gap-10" variant="outline">
          <span className="uppercase font-semibold tracking-wide">Subscribed</span>
        </Button>
      )
    } else {
      return (
        <Button asChild className="rounded-full flex gap-10">
          <Link href="/pricing">
            <span className="uppercase font-semibold tracking-wide">Subscribe</span>
          </Link>
        </Button>
      )
    }
  }

  return (
    <div className="flex flex-col">
      {/* Cover image component */}
      <CoverImage />
      
      <div className="flex flex-col p-4">
        {/* User avatar and subscription button */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {/* User avatar */}
          <Avatar className='w-20 h-20 border-2 -mt-10'>
            <AvatarImage src={user.image || "/user-placeholder.png"} className='object-cover' />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          {/* Subscription button */}
          <div className="flex">
            {renderActionButton()}
          </div>
        </div>

        {/* User information */}
        <div className="flex flex-col mt-4">
          {/* User name */}
          <p className="text-lg font-semibold">{user.name}</p>
          {/* User bio */}
          <p className="text-sm mt-2 md:text-md">
            {user.bio || "No bio available."}
          </p>
        </div>
      </div>
      
      {/* Decorative divider */}
      <div aria-hidden="true" className="h-2 w-full bg-muted"/>
    </div>
  )
}

export default UserProfile
