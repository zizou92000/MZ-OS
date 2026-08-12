import {
  Boxes,
  CalendarRange,
  Clapperboard,
  Coins,
  Compass,
  FileText,
  FlaskConical,
  Kanban,
  LayoutGrid,
  Library,
  Quote,
  Table2,
  Truck,
  type LucideIcon,
} from "lucide-react";

export type ModuleStatus = "live" | "coming-soon";

export type ModuleRoute = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in ⌘K and as the sidebar tooltip. */
  description: string;
};

export type OsModule = {
  id: string;
  label: string;
  tagline: string;
  icon: LucideIcon;
  status: ModuleStatus;
  basePath: string;
  routes: ModuleRoute[];
};

/**
 * The single source of truth for the shell. Adding a module here makes it
 * appear in the sidebar, the ⌘K palette and the OS home — no other edit.
 */
export const MODULES: OsModule[] = [
  {
    id: "creative",
    label: "Creative OS",
    tagline: "Tester, trancher, itérer",
    icon: Clapperboard,
    status: "live",
    basePath: "/creative",
    routes: [
      {
        href: "/creative",
        label: "Cockpit",
        icon: Compass,
        description: "Ce qu'il faut trancher aujourd'hui",
      },
      {
        href: "/creative/library",
        label: "Librairie",
        icon: Library,
        description: "Toutes les créatives et leur lignée",
      },
      {
        href: "/creative/hooks",
        label: "Accroches",
        icon: Quote,
        description: "Hooks vidéo et titres statiques",
      },
      {
        href: "/creative/performance",
        label: "Performance",
        icon: Table2,
        description: "Saisie hebdomadaire",
      },
      {
        href: "/creative/scoreboard",
        label: "Enseignements",
        icon: LayoutGrid,
        description: "Ce que les tests ont prouvé",
      },
      {
        href: "/creative/calendar",
        label: "Saisonnalité",
        icon: CalendarRange,
        description: "Les douze fenêtres commerciales",
      },
      {
        href: "/creative/backlog",
        label: "Production",
        icon: Kanban,
        description: "Ce qui est en cours de fabrication",
      },
      {
        href: "/creative/economics",
        label: "Économie",
        icon: Coins,
        description: "Offre active, seuils et simulateur",
      },
      {
        href: "/creative/scripts",
        label: "Scripts",
        icon: FileText,
        description: "L'ADN des familles et leurs plans",
      },
    ],
  },
  {
    id: "strategy",
    label: "Strategy OS",
    tagline: "Positionnement et offre",
    icon: FlaskConical,
    status: "coming-soon",
    basePath: "/strategy",
    routes: [],
  },
  {
    id: "finance",
    label: "Finance OS",
    tagline: "Trésorerie et marge",
    icon: Boxes,
    status: "coming-soon",
    basePath: "/finance",
    routes: [],
  },
  {
    id: "supply",
    label: "Supply OS",
    tagline: "Stock et approvisionnement",
    icon: Truck,
    status: "coming-soon",
    basePath: "/supply",
    routes: [],
  },
];

export function moduleForPath(pathname: string): OsModule | undefined {
  return (
    MODULES.filter((m) => pathname.startsWith(m.basePath)).sort(
      (a, b) => b.basePath.length - a.basePath.length,
    )[0] ?? MODULES.find((m) => m.status === "live")
  );
}

export function routeForPath(pathname: string): ModuleRoute | undefined {
  const mod = moduleForPath(pathname);
  if (!mod) return undefined;
  return mod.routes
    .filter((r) => pathname === r.href || pathname.startsWith(`${r.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
