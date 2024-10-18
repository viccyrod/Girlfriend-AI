"use client";

import Image from 'next/image';
import Home from '@/app/page';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import React from 'react'
import { HomeIcon , CameraIcon , PersonIcon, LayoutIcon, GearIcon, ChatBubbleIcon } from '@radix-ui/react-icons';
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
		icon: PersonIcon,
		label: "AI Models",
		href: "/community",
	},
	
    {
        icon: ChatBubbleIcon,
        label: "Chat",
        href: "/chat",
    },
    {
		icon: CameraIcon,
		label: "Creator Studio",
		href: "http://localhost:3000/creator",
	},
];

const Sidebar = () => {
    const { getUser } = useKindeBrowserClient();
    const isAdmin = user.email === process.env.ADMIN_EMAIL;

    return (
        <div className="flex lg:w-1/5 flex-col h-screen py-6 px-4 border-r sticky left-0 top-0">
            <div className="justify-center mb-6">
                <Image
                    src="/logo.png" // Replace with your logo path
                    alt="Logo"
                    width={382}
                    height={91}
                    className="mx-auto"
                />
            </div>
            <div className="flex-grow">
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
                </nav>
            </div>
            <div className="mt-auto">
                <div className="flex items-center justify-between mb-4 p-2 rounded-lg hover:bg-primary-foreground transition-colors">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={user.image} className="object-cover" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <div className="hidden lg:block">
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="hover:bg-primary/10 p-2 rounded-full">
                            <GearIcon className="w-5 h-5" />    
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Link href="/update-profile">Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Link href="#">Billing</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <LogoutButton />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex justify-center">
                    <ModeToggle />
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
