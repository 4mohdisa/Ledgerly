"use client"

import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarRail } from "../ui/sidebar";
import { LucideIcon, Home, List, Tag, Repeat } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const navItems = [
  { title: "Dashboard", icon: Home, url: "/" },
  { title: "Transactions", icon: List, url: "/transactions" },
  { title: "Categories", icon: Tag, url: "/categories" },
  { title: "Recurring Transactions", icon: Repeat, url: "/recurring-transactions" },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <UserButton afterSignOutUrl="/" />
      </SidebarHeader>
      <SidebarContent>
        {navItems.map((item) => (
          <a key={item.title} href={item.url} className="flex items-center gap-2 p-2">
            <item.icon className="w-5 h-5" />
            <span>{item.title}</span>
          </a>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarRail />
      </SidebarFooter>
    </Sidebar>
  );
}
