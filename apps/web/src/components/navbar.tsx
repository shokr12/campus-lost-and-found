"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Search, Plus, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">
              CampusFound
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/board"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Lost & Found Board
            </Link>
            <Link
              href="/help"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Help Center
            </Link>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search items..."
              className="h-9 w-64 rounded-full bg-secondary pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/post/new">
                <Button size="sm" className="gap-2 rounded-full">
                  <Plus className="h-4 w-4" />
                  Post Item
                </Button>
              </Link>

              <div className="h-8 w-[1px] bg-border mx-1" />

              <Link href="/me">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="rounded-full text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-full">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="flex flex-col gap-4 p-4">
              <Link href="/board" className="text-lg font-medium">
                Board
              </Link>
              <Link href="/help" className="text-lg font-medium">
                Help Center
              </Link>
              {user ? (
                <>
                  <Link href="/post/new" className="text-lg font-medium">
                    Post Item
                  </Link>
                  <Link href="/me" className="text-lg font-medium">
                    My Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="text-lg font-medium text-destructive text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-lg font-medium">
                    Login
                  </Link>
                  <Link href="/register" className="text-lg font-medium">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
