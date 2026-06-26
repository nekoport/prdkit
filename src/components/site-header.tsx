"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FileText, LogOut, User as UserIcon, Plus, Shield, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function SiteHeader() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null);

  // Fetch user role when session exists
  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.role) {
          setUserRole(data.role);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-foreground text-background">
            <FileText className="h-4 w-4" strokeWidth={2.5} />
            <div className="absolute inset-0 bg-accent opacity-0 transition-opacity group-hover:opacity-100" />
            <FileText className="absolute h-4 w-4 text-background opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-bold tracking-tight">
              PRDKit
            </span>
            <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              PRD Studio
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="h-4 w-4 hidden dark:block" />
          </Button>

          {session?.user ? (
            <>
              <Button asChild size="sm" className="cta-glow h-9 gap-1.5 rounded-full">
                <Link href="/new">
                  <Plus className="h-4 w-4" /> Bikin PRD
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Account"
                    className="h-9 w-9 rounded-full border border-border/60"
                  >
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                      Logged in as
                    </span>
                    <span className="block truncate text-sm font-medium text-foreground">
                      {session.user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/new" className="cursor-pointer">
                      <Plus className="mr-2 h-4 w-4" /> Bikin PRD baru
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" /> Pengaturan Akun
                    </Link>
                  </DropdownMenuItem>
                  {userRole === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer text-accent focus:text-accent">
                          <Shield className="mr-2 h-4 w-4" /> Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="h-9 rounded-full">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="h-9 rounded-full">
                <Link href="/sign-up">Daftar gratis</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
