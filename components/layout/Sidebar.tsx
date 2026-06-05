"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  Boxes,
  Users,
  UserCog,
  CalendarRange,
  Route,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  section?: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    section: "GESTIÓN",
    items: [
      { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
      { href: "/unidades", label: "Unidades", icon: Boxes },
    ],
  },
  {
    section: "PERSONAL",
    items: [
      { href: "/dotacion", label: "Dotación", icon: Users },
      { href: "/supervisores", label: "Supervisores", icon: UserCog },
    ],
  },
  {
    section: "PLANIFICACIÓN",
    items: [
      { href: "/timeline", label: "Timeline", icon: CalendarRange },
      { href: "/rutas", label: "Rutas de Visita", icon: Route },
    ],
  },
  {
    section: "ANÁLISIS",
    items: [
      { href: "/costos", label: "Costos", icon: DollarSign },
      { href: "/reportes", label: "Reportes PDF", icon: FileText },
    ],
  },
  {
    section: "SISTEMA",
    items: [{ href: "/admin", label: "Admin", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-border"
      style={{ width: "220px" }}
    >
      {/* Logo */}
      <div className="flex items-center px-5 py-6 border-b border-border">
        <img src="/formatto-logo.svg" alt="Formatto" className="h-5 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV.map((group, gi) => (
          <div key={gi} className="space-y-0.5">
            {group.section && (
              <p className="px-2 mb-1.5 text-2xs font-semibold text-muted-foreground/60 uppercase tracking-widest">
                {group.section}
              </p>
            )}
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2.5 px-2 py-2 text-sm font-normal transition-colors duration-100 border-l-2 ${
                    active
                      ? "text-primary border-primary bg-accent pl-[6px] font-semibold"
                      : "text-formatto-grafito/70 border-transparent hover:text-formatto-grafito hover:bg-accent"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-formatto-bark group-hover:text-formatto-grafito"}`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      {session?.user && (
        <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-2xs font-semibold text-formatto-grafito truncate">
              {session.user.name ?? session.user.email}
            </p>
            <p className="text-2xs text-muted-foreground uppercase tracking-widest">{session.user.role}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-formatto-bark hover:text-primary transition-colors flex-shrink-0"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
