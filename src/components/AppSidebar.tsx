
"use client"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  FileText,
  PlusSquare,
  LayoutTemplate,
  Code2,
} from "lucide-react"
import { usePathname } from 'next/navigation'
import Link from "next/link"

export function AppSidebar() {
  const pathname = usePathname();

  const isMenuItemActive = (path: string) => {
    if (path === '/') return pathname === path;
    return pathname.startsWith(path);
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold">TemplateFlow</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/editor/designer/new" legacyBehavior passHref>
              <SidebarMenuButton tooltip="Designer Template" isActive={isMenuItemActive('/editor/designer')}>
                <LayoutTemplate />
                <span>Designer Template</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/editor/code/new" legacyBehavior passHref>
              <SidebarMenuButton tooltip="Code-only Template" isActive={isMenuItemActive('/editor/code')}>
                <Code2 />
                <span>Code-only Template</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/" legacyBehavior passHref>
              <SidebarMenuButton tooltip="All Templates" isActive={isMenuItemActive('/')}>
                <FileText />
                <span>All Templates</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  );
}
