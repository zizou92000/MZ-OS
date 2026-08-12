"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronsUpDown, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { MODULES, moduleForPath } from "@/modules/registry";
import { cn } from "@/lib/utils";
import { ratio } from "@/lib/format";

export type ActiveOfferSummary = {
  name: string;
  roasBreakEven: number | null;
  roasMinMargin: number | null;
  roasTarget: number | null;
} | null;

export function OsSidebar({ offer }: { offer: ActiveOfferSummary }) {
  const pathname = usePathname();
  const activeModule = moduleForPath(pathname);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                    <span className="code text-[13px] font-semibold">OL</span>
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-semibold">
                      {activeModule?.label ?? "OLEN OS"}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {activeModule?.tagline ?? "Système interne"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
              >
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Modules
                </DropdownMenuLabel>
                {MODULES.map((mod) => {
                  const disabled = mod.status === "coming-soon";
                  const Icon = mod.icon;
                  const item = (
                    <DropdownMenuItem
                      key={mod.id}
                      disabled={disabled}
                      className="gap-2"
                      asChild={!disabled}
                    >
                      {disabled ? (
                        <>
                          <Icon className="size-4 shrink-0" />
                          <span className="flex-1">{mod.label}</span>
                          <Badge
                            variant="outline"
                            className="rounded-sm px-1 py-0 text-[10px]"
                          >
                            Bientôt
                          </Badge>
                        </>
                      ) : (
                        <Link href={mod.basePath}>
                          <Icon className="size-4 shrink-0" />
                          <span className="flex-1">{mod.label}</span>
                          {activeModule?.id === mod.id && (
                            <Check className="size-4" />
                          )}
                        </Link>
                      )}
                    </DropdownMenuItem>
                  );
                  return item;
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Vues</SidebarGroupLabel>
          <SidebarMenu>
            {activeModule?.routes.map((route) => {
              const Icon = route.icon;
              const isActive =
                pathname === route.href ||
                (route.href !== activeModule.basePath &&
                  pathname.startsWith(`${route.href}/`));
              return (
                <SidebarMenuItem key={route.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={route.description}
                  >
                    <Link href={route.href}>
                      <Icon className="size-4" />
                      <span>{route.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ActiveOfferCard offer={offer} />
        <ThemeToggle />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function ActiveOfferCard({ offer }: { offer: ActiveOfferSummary }) {
  return (
    <Link
      href="/creative/economics"
      className={cn(
        "border-sidebar-border bg-sidebar-accent/40 hover:bg-sidebar-accent group/offer block rounded-md border p-2 transition-colors",
        "group-data-[collapsible=icon]:hidden",
      )}
    >
      <div className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        Offre active
      </div>
      <div className="mt-0.5 truncate text-xs font-medium">
        {offer?.name ?? "Aucune offre"}
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1 text-center">
        <Threshold label="BE" value={offer?.roasBreakEven} />
        <Threshold label="Min" value={offer?.roasMinMargin} />
        <Threshold label="Cible" value={offer?.roasTarget} />
      </div>
    </Link>
  );
}

function Threshold({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="bg-background/50 rounded-sm px-1 py-0.5">
      <div className="text-muted-foreground text-[9px] tracking-wide uppercase">
        {label}
      </div>
      <div className="num text-[11px] font-semibold">{ratio(value)}</div>
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setTheme(isDark ? "light" : "dark")}
          tooltip={isDark ? "Passer en clair" : "Passer en sombre"}
        >
          {mounted && !isDark ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
          <span>{mounted && !isDark ? "Thème clair" : "Thème sombre"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
