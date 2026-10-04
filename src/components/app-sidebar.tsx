"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { workspaceForPath, type NavNode } from "@/lib/workspaces";

function isActivePath(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

function NavItem({ node, pathname }: { node: NavNode; pathname: string }) {
  const { state, setOpen } = useSidebar();

  const containsActive = Boolean(
    node.items?.some((leaf) => isActivePath(pathname, leaf.url))
  );
  const [open, setOpen_] = React.useState(containsActive);

  // Re-open the branch when navigation lands inside it, adjusting during render
  // rather than in an effect so there is no second paint with it still closed.
  const [wasActive, setWasActive] = React.useState(containsActive);
  if (containsActive !== wasActive) {
    setWasActive(containsActive);
    if (containsActive) setOpen_(true);
  }

  if (!node.items) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          render={<Link href={node.url ?? "#"} />}
          isActive={node.url ? pathname === node.url : false}
          tooltip={node.title}
        >
          <node.icon />
          <span>{node.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={node.title}
        isActive={containsActive && state === "collapsed"}
        aria-expanded={open}
        onClick={() => {
          // A collapsed rail has nowhere to show the sub-list, so expand first.
          if (state === "collapsed") setOpen(true);
          setOpen_((previous) => (state === "collapsed" ? true : !previous));
        }}
      >
        <node.icon />
        <span>{node.title}</span>
        <ChevronRight
          className={`ml-auto size-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </SidebarMenuButton>
      {open ? (
        <SidebarMenuSub>
          {node.items.map((leaf) => (
            <SidebarMenuSubItem key={leaf.url}>
              <SidebarMenuSubButton
                render={<Link href={leaf.url} />}
                isActive={pathname === leaf.url}
              >
                <span>{leaf.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  );
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; username: string };
}) {
  const pathname = usePathname();
  const workspace = workspaceForPath(pathname);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher active={workspace} />
      </SidebarHeader>
      <SidebarContent>
        {workspace.groups.map((group) => (
          <SidebarGroup key={`${workspace.id}-${group.label}`}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((node) => (
                  // Keyed by workspace so switching rebuilds the open/closed state.
                  <NavItem
                    key={`${workspace.id}-${node.title}`}
                    node={node}
                    pathname={pathname}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
