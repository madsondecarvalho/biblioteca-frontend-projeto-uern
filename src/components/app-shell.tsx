"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  BookOpen,
  Users,
  Tags,
  PenLine,
  Library,
  CalendarClock,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, admin: false },
  { href: "/books", label: "Livros", icon: BookOpen, admin: false },
  { href: "/authors", label: "Autores", icon: PenLine, admin: false },
  { href: "/categories", label: "Categorias", icon: Tags, admin: false },
  { href: "/copies", label: "Cópias", icon: Library, admin: false },
  { href: "/reservations", label: "Reservas", icon: CalendarClock, admin: false },
  { href: "/users", label: "Usuários", icon: Users, admin: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();

  // Página de login usa layout próprio
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <aside className="hidden w-60 flex-col border-r border-zinc-200 bg-white p-4 md:flex dark:border-zinc-800 dark:bg-zinc-950">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <BookOpen className="h-6 w-6" />
          <span className="text-lg font-bold">Biblioteca UERN</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {links
            .filter((l) => !l.admin || isAdmin)
            .map((l) => {
              const active =
                l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    active
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
        </nav>
        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="truncate px-2 text-sm font-medium">{user?.name}</p>
          <p className="truncate px-2 text-xs text-zinc-500">
            {user?.email} — {user?.role === "admin" ? "Admin" : "Usuário"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <BookOpen className="h-5 w-5" /> Biblioteca UERN
          </Link>
          <Button variant="outline" size="sm" onClick={logout}>
            Sair
          </Button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-zinc-200 bg-white px-4 py-2 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
          {links
            .filter((l) => !l.admin || isAdmin)
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm",
                  pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href))
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-400"
                )}
              >
                {l.label}
              </Link>
            ))}
        </nav>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
