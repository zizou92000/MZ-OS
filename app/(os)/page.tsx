import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MODULES } from "@/modules/registry";
import { cn } from "@/lib/utils";

export default function OsHome() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight">OLEN OS</h1>
        <p className="text-muted-foreground text-sm">
          Quatre modules, un seul poste de pilotage.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const live = mod.status === "live";

          const inner = (
            <Card
              className={cn(
                "h-full gap-0 py-4 transition-colors",
                live
                  ? "hover:border-primary/40 hover:bg-surface-raised"
                  : "opacity-55",
              )}
            >
              <CardHeader className="px-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md border",
                      live
                        ? "border-primary/25 bg-primary/10 text-primary"
                        : "text-muted-foreground bg-muted",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {mod.label}
                      {!live && (
                        <Badge
                          variant="outline"
                          className="rounded-sm px-1 py-0 text-[10px] font-normal"
                        >
                          Bientôt
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {mod.tagline}
                    </CardDescription>
                  </div>
                  {live && (
                    <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                  )}
                </div>
              </CardHeader>
              {live && mod.routes.length > 0 && (
                <CardContent className="px-4 pt-3">
                  <div className="flex flex-wrap gap-1">
                    {mod.routes.map((r) => (
                      <span
                        key={r.href}
                        className="bg-muted text-muted-foreground rounded-sm px-1.5 py-0.5 text-[11px]"
                      >
                        {r.label}
                      </span>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );

          return live ? (
            <Link
              key={mod.id}
              href={mod.basePath}
              className="rounded-xl focus-visible:outline-2"
            >
              {inner}
            </Link>
          ) : (
            <div key={mod.id} aria-disabled className="cursor-not-allowed">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
