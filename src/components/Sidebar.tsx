"use client";

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { HomeIcon, CameraIcon, PersonIcon, GearIcon, ChatBubbleIcon, HamburgerMenuIcon, Cross1Icon, GlobeIcon } from '@radix-ui/react-icons';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from './ui/dropdown-menu';
import { ModeToggle } from './ModeToggle';
import LogoutButton from './LogoutButton';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import AuthButton from "./AuthButton";

const SIDEBAR_LINKS = [
    {
        icon: HomeIcon,
        label: "Home",
        href: "/",
    },
    {
        icon: GlobeIcon,
        label: "Community",
        href: "/community",
    },
    {
        icon: PersonIcon,
        label: "My Models",
        href: "/my-models",
    },
    {
        icon: ChatBubbleIcon,
        label: "Chat",
        href: "/chat",
    },
    {
        icon: CameraIcon,
        label: "Creator Studio",
        href: "/creator-studio",
    },
];

const Sidebar = () => {
    const { user, isLoading } = useKindeBrowserClient();
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    // const isAdmin = user?.email === process.env.ADMIN_EMAIL;

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Hamburger menu for mobile */}
            <button
                aria-label="Toggle sidebar"
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background rounded-md"
                onClick={toggleSidebar}
            >
                {isOpen ? <Cross1Icon className="w-6 h-6" /> : <HamburgerMenuIcon className="w-6 h-6" />}
            </button>

            {/* Overlay for mobile when sidebar is open */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full bg-background transform transition-transform duration-300 ease-in-out z-50 shadow-lg
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:w-64
                flex flex-col py-6 px-4 border-r`}>
                
                {/* Main Content */}
                <div className="flex flex-col h-full">
                    
                    {/* Logo - only show on desktop */}
                    <div className="flex-shrink-0 mb-6 hidden lg:block">
                        <Link href="/" className="flex items-center mb-6 px-2">
                            <Image
                                src="/logo-gradient.svg"
                                alt="girlfriend.cx"
                                width={200}
                                height={60}
                                className="w-auto h-[45px] hover:scale-105 transition-transform duration-300"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-grow mb-6 mt-12 lg:mt-0">
                        {SIDEBAR_LINKS.map(link => (
                            <Link key={link.href} href={link.href}
                                className="flex items-center gap-3 p-3 text-sm hover:bg-primary-foreground hover:text-primary rounded-lg transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <link.icon className="w-5 h-5" />
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* User Info & Settings at the Bottom */}
                    <div className="mt-auto">
                        {user ? (
                            <>
                                <div className="flex items-center justify-between p-2 hover:bg-primary-foreground rounded-lg transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={user?.picture || ""} className="object-cover" />
                                            <AvatarFallback>CN</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{user?.given_name} {user?.family_name}</p>
                                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                                        </div>
                                    </div>

                                    {/* Gear Icon with Dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="p-2 hover:bg-gray-600 rounded-full transition-colors">
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

                                {/* Mode Toggle */}
                                <div className="flex justify-center mt-4">
                                    <ModeToggle />
                                </div>
                            </>
                        ) : (
                            <AuthButton isAuthenticated={false} />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
