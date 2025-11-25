"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  AudioWaveform,
  Command,
  Star,
  List,
  GalleryVerticalEnd,
  Shield,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { VaultSwitcher } from "@/components/vault-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "Nam Nguyen",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Personal",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "All Items",
      url: "/dashboard/all-items",
      icon: List,
    },
    {
      title: "Share",
      url: "/dashboard/share",
      icon: Star,
    },
    {
      title: "Safe",
      url: "/dashboard/safe",
      icon: Shield,
    },
  ],
  categories: [
    {
      title: "Archive",
      url: "#",
      icon: AudioWaveform,
    },
    {
      title: "Recently Deleted",
      url: "#",
      icon: AudioWaveform,
    },
  ],
  tags: [],
};

export function AppSidebar({ ...props }) {
  const pathname = usePathname();

  // Add isActive property to navigation items based on current path
  const navMainWithActive = data.navMain.map((item) => {
    // For the All Items route, also mark active for root and /dashboard paths
    if (item.url === "/dashboard/all-items") {
      return {
        ...item,
        isActive:
          pathname === "/dashboard/all-items" ||
          pathname === "/dashboard" ||
          pathname === "/",
      };
    }

    // For other routes, check if the pathname exactly matches or starts with the item's URL
    return {
      ...item,
      isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
    };
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <VaultSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
