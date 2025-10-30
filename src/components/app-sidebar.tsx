import {
  Home,
  Settings,
  LogIn,
  CircleUser,
  HelpCircle,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
// Menu items.
const items = [
  {
    title: 'Home',
    url: '/',
    icon: Home
  },
  {
    title: 'Courses',
    url: '/course',
    icon: GraduationCap
  },
  {
    title: 'Lessons',
    url: '/lessons',
    icon: BookOpen
  },
  {
    title: 'Questions',
    url: '/questions',
    icon: HelpCircle
  },
  {
    title: 'My Account',
    url: '#',
    icon: CircleUser
  },
  {
    title: 'Settings',
    url: '#',
    icon: Settings
  },
  {
    title: 'Sign In',
    url: '/signin',
    icon: LogIn
  }
];
export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <div className="rounded bg-[#232f3e] px-4 py-3 text-lg font-bold text-white">
          👤 Hello, sign in
        </div>
        <SidebarGroup>
          <SidebarGroupLabel></SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

// import { ChevronRight } from "lucide-react"
// import {
//   Sidebar,
//   SidebarContent,
//   SidebarGroup,
//   SidebarGroupLabel,
//   SidebarGroupContent,
// } from "@/components/ui/sidebar"
// import React from "react"
// import { useState, useEffect } from "react"
// const menuSections = [
//   {
//     title: "Digital Content & Devices",
//     items: ["Prime Video", "Amazon Music", "Kindle E-readers & Books", "Amazon Appstore"],
//   },
//   {
//     title: "Shop by Department",
//     items: ["Electronics", "Computers", "Smart Home", "Arts & Crafts", "See all"],
//   },
//   {
//     title: "Programs & Features",
//     items: ["Gift Cards", "Shop By Interest"],
//   },
// ]

// export function AppSidebar() {

//   return (
//     <Sidebar className="w-72 bg-white text-black overflow-y-auto">
//       <SidebarContent className="p-4 space-y-6">
//         {/* Fake login header */}
//         <div className="font-bold text-lg bg-[#232f3e] text-white px-4 py-3 rounded">
//           👤 Hello, sign in
//         </div>

//         {menuSections.map((section) => (
//           <SidebarGroup key={section.title}>
//             <SidebarGroupLabel className="text-base font-bold mb-2">
//               {section.title}
//             </SidebarGroupLabel>
//             <SidebarGroupContent className="space-y-1">
//               {section.items.map((item) => (
//                 <div
//                   key={item}
//                   className="flex justify-between items-center px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
//                 >
//                   <span>{item}</span>
//                   <ChevronRight className="w-4 h-4 text-gray-400" />
//                 </div>
//               ))}
//             </SidebarGroupContent>
//           </SidebarGroup>
//         ))}
//       </SidebarContent>
//     </Sidebar>
//   )
// }
