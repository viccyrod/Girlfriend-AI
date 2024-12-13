'use client';

import { Mail } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function Sidebar() {
  const pathname = usePathname();

  const navigationItems = [
    {
      href: '/admin/emails',
      label: 'Email Management',
      icon: Mail,
      active: pathname === '/admin/emails'
    }
  ];

  return (
    <nav className="space-y-2">
      {navigationItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent ${
            item.active ? 'bg-accent' : ''
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

