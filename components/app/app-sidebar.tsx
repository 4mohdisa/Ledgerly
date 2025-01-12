"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Home, List, Repeat, Tag } from 'lucide-react';

// Define navigation items
const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Transactions", url: "/transactions", icon: List },
  { title: "Recurring Transactions", url: "/recurring-transactions", icon: Repeat },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="w-[15vw] bg-white border-r border-gray-200">
      <SidebarContent>
        <div className="p-6 mb-8">
          <Image src="/Ledgerly.svg" alt="Ledgerly Logo" width={150} height={40} className="mx-auto" />
        </div>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = pathname === item.url;
              return (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url} passHref>
                    <div className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out
                      ${isActive 
                        ? 'bg-black text-white' 
                        : 'text-gray-700 hover:bg-black hover:text-white'
                      }
                    `}>
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

