"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { moduleForPath, routeForPath } from "@/modules/registry";
import { MigrationWizard } from "@/components/migration-wizard";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export function OsTopbar({ trailing }: { trailing?: string }) {
  const pathname = usePathname();
  const mod = moduleForPath(pathname);
  const route = routeForPath(pathname);
  const isModuleRoot = route?.href === mod?.basePath;

  return (
    <header className="bg-background/80 sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b px-3 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <Breadcrumb>
        <BreadcrumbList className="text-xs">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">OLEN OS</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {mod && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isModuleRoot && !trailing ? (
                  <BreadcrumbPage>{mod.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={mod.basePath}>{mod.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </>
          )}
          {route && !isModuleRoot && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {trailing ? (
                  <BreadcrumbLink asChild>
                    <Link href={route.href}>{route.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{route.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}
          {trailing && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="code">{trailing}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <CommandPalette />
        <SettingsMenu />
      </div>
    </header>
  );
}

function SettingsMenu() {
  return (
    <MigrationWizard
      trigger={
        <Button variant="ghost" size="icon" className="size-8">
          <Settings className="size-4" />
          <span className="sr-only">Réglages et migration</span>
        </Button>
      }
    />
  );
}
