"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { WORKSPACES, type Workspace } from "@/lib/workspaces";

export function WorkspaceSwitcher({ active }: { active: Workspace }) {
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const ActiveIcon = active.icon;

  function switchTo(workspace: Workspace) {
    if (workspace.id === active.id) return;
    setOpenMobile(false);
    router.push(workspace.home);
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                aria-label={`Workspace: ${active.name}. Switch workspace`}
                className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <ActiveIcon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{active.name}</span>
              <span className="truncate text-xs">{active.tagline}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-60 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
          >
            {/* Base UI requires GroupLabel to sit inside a Group. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              {WORKSPACES.map((workspace) => {
                const Icon = workspace.icon;
                const isActive = workspace.id === active.id;
                return (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => switchTo(workspace)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <Icon className="size-3.5 shrink-0" />
                    </div>
                    <div className="grid flex-1 leading-tight">
                      <span className="truncate text-sm font-medium">{workspace.name}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {workspace.tagline}
                      </span>
                    </div>
                    {isActive ? <Check className="size-4 shrink-0" /> : null}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
