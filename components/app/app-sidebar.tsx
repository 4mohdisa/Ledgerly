"use client";

import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Home, List, Repeat, Tag } from "lucide-react";

// Define navigation items
const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Transactions", url: "/transactions", icon: List },
  { title: "Categories", url: "/categories", icon: Tag },
  { title: "Recurring Transactions", url: "/recurring-transactions", icon: Repeat },
];

export function AppSidebar() {
  console.log("Rendering AppSidebar");
  return (
    <Sidebar className="w-[15vw] bg-white">
      <SidebarContent>
        <div className="p-4 mb-8"> {/* Space for Logo */}
          <img src="/path/to/logo.png" alt="Logo" className="w-16 h-16 mx-auto" />
        </div>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="flex items-center gap-2 p-2">
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
