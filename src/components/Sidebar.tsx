// Client-side component
"use client";

// Import components and necessary libraries
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { HomeIcon, CameraIcon, MagnifyingGlassIcon, LayoutIcon, PersonIcon, ChatBubbleIcon, MagicWandIcon } from '@radix-ui/react-icons';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from './ui/dropdown-menu';
import { ModeToggle } from './ModeToggle';
import LogoutButton from './LogoutButton';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';

// Define sidebar links
const SIDEBAR_LINKS = [
  {
    icon: HomeIcon,
    label: "News Feed",
    href: "/",
  },
  {
    icon: MagnifyingGlassIcon,
    label: "Community",
    href: "/Community",
  },
  {
    icon: CameraIcon,
    label: "Creator Studio",
    href: "http://localhost:3000/creator",
  },
  {
    icon: ChatBubbleIcon,
    label: "Chat",
    href: "/chat",
  },
  {
    icon: MagicWandIcon,
    label: "Profile",
    href: "/profile",
  },
];

// Sidebar component for navigation
const Sidebar = () => {
  // Use Kinde authentication client to get user details
  const { user, isLoading } = useKindeBrowserClient();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user && !isLoading) {
      setIsAdmin(user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);
    }
  }, [user, isLoading]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex lg:w-1/5 flex-col h-screen py-6 px-4 border-r sticky left-0 top-0">
      <div className="flex-grow">
        {/* User profile link */}
        <Link href="/update-profile" className="max-w-fit block mb-6">
          <Avatar className="w-12 h-12 cursor-pointer">
            <AvatarImage src={user?.picture || ''} className="object-cover" />
            <AvatarFallback>{user?.given_name?.[0]}{user?.family_name?.[0]}</AvatarFallback>
          </Avatar>
        </Link>
        {/* Navigation links */}
        <nav className="flex flex-col gap-2">
          {SIDEBAR_LINKS.map(link => (
            <Link key={link.href} href={link.href} 
              className='flex w-full items-center gap-3 hover:bg-primary-foreground font-medium hover:text-primary px-3 py-2 rounded-lg transition-colors'>
              <link.icon className="w-5 h-5" />
              <span className="hidden lg:block">{link.label}</span>
            </Link>
          ))}

          {/* Admin-only link to secret dashboard */}
          {isAdmin && (
            <Link
              href="/secret-dashboard"
              className='flex w-full items-center gap-3 hover:bg-primary-foreground font-medium hover:text-primary px-3 py-2 rounded-lg transition-colors'
            >
              <LayoutIcon className='w-5 h-5' />
              <span className='hidden lg:block'>Dashboard</span>
            </Link>
          )}
          {/* Dropdown menu for account settings */}
          <DropdownMenu>
            <DropdownMenuTrigger className='flex w-full items-center gap-3 hover:bg-primary-foreground font-medium hover:text-primary px-3 py-2 rounded-lg transition-colors'>
              <PersonIcon className='w-5 h-5' />
              <span className='hidden lg:block'>Settings</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="#">
                <DropdownMenuItem>Billing</DropdownMenuItem>
              </Link>
              {/* Logout button */}
              <LogoutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
      {/* Dark/light mode toggle button */}
      <div className="mt-auto">
        <ModeToggle />
      </div>
    </div>
  );
};

export default Sidebar;
