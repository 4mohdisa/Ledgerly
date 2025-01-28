"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarMenu, 
  SidebarMenuItem, 
} from "@/components/ui/sidebar";
import { Home, List, Repeat, ChevronsUpDown, Settings, LogOut } from 'lucide-react';
import { useUser, SignedIn, SignOutButton, useClerk } from "@clerk/nextjs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Define navigation items
const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Transactions", url: "/transactions", icon: List },
  { title: "Recurring Transactions", url: "/recurring-transactions", icon: Repeat },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { openUserProfile } = useClerk();

  return (
    <Sidebar className="w-[15vw] bg-white border-r border-gray-200">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-6 mb-8">
          <Image 
            src="/Ledgerly.svg" 
            alt="Ledgerly Logo" 
            width={150} 
            height={40} 
            className="mx-auto h-auto w-auto" 
            priority
          />
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
        
        {/* User Profile Section */}
        <div className="mt-auto p-4">
          <SignedIn>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative w-full justify-start space-x-3 px-4 py-3 h-auto">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'User'} />
                    <AvatarFallback className="rounded-lg">
                      {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.fullName || 'User'}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress || 'No email'}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" side="right" sideOffset={8}>
                <DropdownMenuItem onClick={() => openUserProfile()}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <SignOutButton>
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </SignOutButton>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
