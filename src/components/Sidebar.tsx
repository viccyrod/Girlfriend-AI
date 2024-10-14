"use client";

import Home from '@/app/page';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import React from 'react'
import { HomeIcon , CameraIcon , MagnifyingGlassIcon, LayoutIcon, PersonIcon } from '@radix-ui/react-icons';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from './ui/dropdown-menu';
import { ModeToggle } from './ModeToggle';
import LogoutButton from './LogoutButton';

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
		href: "/Creator Studio",
	},
];

const Sidebar = () => {
    const isAdmin = true;

    return (
        <div className="flex lg:w-1/5 flex-col gap-3 px-2 border-r sticky 
        left-0 top-0 h-screen">
            <Link href="/update-profile" className="max-w-fit">
                <Avatar className="mt-4" cursor-pointer>
                    <AvatarImage src="/user-placeholder.png" className="object-cover" />
                    <AvatarFallback> CN </AvatarFallback>
                </Avatar>
            </Link>
            <nav className="flex flex-col gap-3">
                {SIDEBAR_LINKS.map(link => (
                    <Link key={link.href} href={link.href} 
                    className='flex w-12 lg:w-full items-center gap-2 hover:bg-primary-foreground font-bold hover:text-primary px-2 py-1 rounded-full justify-center lg:justify-normal'>
                        <link.icon className="w-6 h-6" /> {/* Ensure link.icon is a valid React component */}
                        <span className="hidden lg:block">{link.label}</span>
                    </Link>
                ))}

                
				{isAdmin && (
					<Link
						href={"/secret-dashboard"}
						className='flex w-12 lg:w-full items-center gap-2 hover:bg-primary-foreground font-bold hover:text-primary px-2 py-1 rounded-full justify-center lg:justify-normal'
					>
						<LayoutIcon className='w-6 h-6' />
						<span className='hidden lg:block'>Dashboard</span>
					</Link>
				)}

                <DropdownMenu>
					<div className='flex w-12 lg:w-full items-center gap-2 hover:bg-primary-foreground font-bold hover:text-primary px-2 py-1 rounded-full justify-center lg:justify-normal'>
						<DropdownMenuTrigger className='flex items-center gap-2'>
							<PersonIcon className='w-6 h-6' />
							<span className='hidden lg:block'>Setting</span>
						</DropdownMenuTrigger>
					</div>

					<DropdownMenuContent>
						<DropdownMenuLabel>My Account</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<Link href={"#"}>
							<DropdownMenuItem>Billing</DropdownMenuItem>
						</Link>
						<LogoutButton />
					</DropdownMenuContent>
				</DropdownMenu>

				<ModeToggle />

            </nav>
        </div>
    );
};

export default Sidebar
