"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, User, LayoutDashboard, Settings, Menu, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { logout } from "@/app/actions/auth"
import { BRAND_NAME } from "@/lib/brand"
import { getInitials } from "@/lib/user-display"

interface NavbarProps {
  user?: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    role: "user" | "admin"
  } | null
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3 font-bold text-lg tracking-tight">
            <img
              src="/logo.png"
              alt={BRAND_NAME}
              className="w-9 h-9 rounded-lg object-cover"
            />
            <span className="hidden sm:inline">{BRAND_NAME}</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/videos"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === "/videos" || pathname?.startsWith("/videos/")
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              Tutorials
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pathname === "/dashboard" 
                      ? "bg-secondary text-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  My Courses
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pathname?.startsWith("/admin") 
                        ? "bg-secondary text-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-border">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
                    <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
                      {getInitials(user.full_name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">{user.full_name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="text-sm font-medium">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="text-sm font-medium">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
