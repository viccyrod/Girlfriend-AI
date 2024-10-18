"use client";

import Home from '@/app/page';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import React from 'react'
import { HomeIcon , CameraIcon , MagnifyingGlassIcon, LayoutIcon, PersonIcon, ChatBubbleIcon } from '@radix-ui/react-icons';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from './ui/dropdown-menu';
import { ModeToggle } from './ModeToggle';
import LogoutButton from './LogoutButton';
import { user } from '@/dummy_data';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';

const SIDEBAR_LINKS = [
	{
		icon: HomeIcon,
		label: "News Feed",
		href: "/",
	},
    {
		icon: MagnifyingGlassIcon,
		label: "Community",
		href: "/community",
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
];

const Sidebar = () => {
    const { getUser } = useKindeBrowserClient();
    const isAdmin = user.email === process.env.ADMIN_EMAIL;

    return (
        <div className="flex lg:w-1/5 flex-col h-screen py-6 px-4 border-r sticky left-0 top-0">
            <div className="flex-grow">
                <Link href="/update-profile" className="max-w-fit block mb-6">
                    <Avatar className="w-12 h-12 cursor-pointer">
                        <AvatarImage src={user.image} className="object-cover" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                </Link>
                <nav className="flex flex-col gap-2">
                    {SIDEBAR_LINKS.map(link => (
                        <Link key={link.href} href={link.href} 
                        className='flex w-full items-center gap-3 hover:bg-primary-foreground font-medium hover:text-primary px-3 py-2 rounded-lg transition-colors'>
                            <link.icon className="w-5 h-5" />
                            <span className="hidden lg:block">{link.label}</span>
                        </Link>
                    ))}

                    {isAdmin && (
                        <Link
                            href="/secret-dashboard"
                            className='flex w-full items-center gap-3 hover:bg-primary-foreground font-medium hover:text-primary px-3 py-2 rounded-lg transition-colors'
                        >
                            <LayoutIcon className='w-5 h-5' />
                            <span className='hidden lg:block'>Dashboard</span>
                        </Link>
                    )}
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
                            <LogoutButton />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </nav>
            </div>
            <div className="mt-auto">
                <ModeToggle />
            </div>
        </div>
    );
};

export default Sidebar;
