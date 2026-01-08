'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const items = [
  {
    title: 'Dashboard',
    url: '/',
    icon: '📊',
  },
  {
    title: 'Investors',
    url: '/investors',
    icon: '👥',
  },
  {
    title: 'Clients',
    url: '/clients',
    icon: '🏢',
  },
  {
    title: 'Matching',
    url: '/matching',
    icon: '🎯',
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = pathname === item.url || (item.url !== '/' && pathname?.startsWith(item.url));
        
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive}>
              <Link href={item.url}>
                <span>{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
