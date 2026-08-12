"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { MODULES } from "@/modules/registry";
import type { SearchHit } from "@/app/api/search/route";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const { data } = useQuery({
    queryKey: ["search", query],
    queryFn: async (): Promise<{ hits: SearchHit[] }> => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Recherche indisponible");
      return res.json();
    },
    enabled: open && query.trim().length > 0,
    placeholderData: (prev) => prev,
  });

  const hits = query.trim() ? (data?.hits ?? []) : [];
  const creatives = hits.filter((h) => h.kind === "creative");
  const accroches = hits.filter((h) => h.kind === "accroche");
  const scripts = hits.filter((h) => h.kind === "script");

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const liveRoutes = MODULES.filter((m) => m.status === "live").flatMap(
    (m) => m.routes,
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground h-8 w-full max-w-64 justify-start gap-2 px-2 font-normal"
      >
        <Search className="size-3.5" />
        <span className="truncate text-xs">Chercher…</span>
        <kbd className="code bg-muted ml-auto rounded-sm px-1 py-0.5 text-[10px]">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Recherche"
        description="Chercher une créative, une accroche ou un script"
      >
        {/* Results are ranked by the server query, so cmdk must not re-filter. */}
        <Command shouldFilter={false}>
        <CommandInput
          placeholder="Code, verbatim, hypothèse…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {query.trim() ? "Rien trouvé." : "Tape pour chercher."}
          </CommandEmpty>

          {creatives.length > 0 && (
            <CommandGroup heading="Créatives">
              {creatives.map((hit) => (
                <CommandItem
                  key={`c-${hit.id}`}
                  value={hit.id}
                  onSelect={() => go(hit.href)}
                  className="gap-2"
                >
                  <span className="code text-xs font-medium">{hit.title}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {hit.subtitle}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {accroches.length > 0 && (
            <CommandGroup heading="Accroches">
              {accroches.map((hit) => (
                <CommandItem
                  key={`a-${hit.id}`}
                  value={hit.id}
                  onSelect={() => go(hit.href)}
                  className="gap-2"
                >
                  <span className="truncate text-xs">{hit.title}</span>
                  <span className="code text-muted-foreground ml-auto text-[11px]">
                    {hit.subtitle}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {scripts.length > 0 && (
            <CommandGroup heading="Scripts">
              {scripts.map((hit) => (
                <CommandItem
                  key={`s-${hit.id}`}
                  value={hit.id}
                  onSelect={() => go(hit.href)}
                  className="gap-2"
                >
                  <span className="code text-xs font-medium">{hit.title}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {hit.subtitle}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {hits.length > 0 && <CommandSeparator />}

          <CommandGroup heading="Aller à">
            {liveRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <CommandItem
                  key={route.href}
                  value={`nav ${route.label} ${route.description}`}
                  onSelect={() => go(route.href)}
                  className="gap-2"
                >
                  <Icon className="size-3.5" />
                  <span className="text-xs">{route.label}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {route.description}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
