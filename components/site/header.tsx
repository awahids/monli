"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QalaLogo } from "@/components/brand/qala-mark";
import { BRAND } from "@/lib/brand";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center rounded-md" aria-label={`${BRAND.name}, beranda`}>
          <QalaLogo markClassName="h-7" textClassName="text-xl" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 relative group py-2.5 px-4 rounded-lg hover:bg-primary/5"
          >
            Features
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-primary transition-all duration-200 group-hover:w-8 rounded-full"></span>
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 relative group py-2.5 px-4 rounded-lg hover:bg-primary/5"
          >
            How it Works
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-primary transition-all duration-200 group-hover:w-8 rounded-full"></span>
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 relative group py-2.5 px-4 rounded-lg hover:bg-primary/5"
          >
            Pricing
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-primary transition-all duration-200 group-hover:w-8 rounded-full"></span>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        {/* <div className="md:hidden">
          <button
            type="button"
            className="mobile-touch-target flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div> */}

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full hover:bg-primary/10 transition-all duration-200"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button
            variant="ghost"
            asChild
            className="rounded-2xl hover:bg-primary/10 transition-all duration-300 hover:scale-105"
          >
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
          <Button asChild className="button-modern relative z-10">
            <Link href="/auth/sign-up">
              <span className="relative z-10">Get Started</span>
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full hover:bg-primary/10 transition-all duration-200"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-9 w-9 rounded-full hover:bg-primary/10 transition-all duration-200"
          >
            <div className="relative w-4 h-4">
              <span
                className={`absolute block h-0.5 w-4 bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`}
              />
              <span
                className={`absolute block h-0.5 w-4 bg-current transform transition duration-300 ease-in-out mt-1.5 ${isMobileMenuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`absolute block h-0.5 w-4 bg-current transform transition duration-300 ease-in-out mt-3 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
              />
            </div>
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-md">
          <div className="container px-4 py-4 space-y-4">
            <nav className="flex flex-col space-y-3">
              <Link
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 py-2"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 py-2"
              >
                How it Works
              </Link>
              <Link
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 py-2"
              >
                Pricing
              </Link>
            </nav>

            <div className="flex flex-col space-y-3 pt-4 border-t border-border/40">
              <Button
                variant="ghost"
                asChild
                className="justify-start h-auto p-2 hover:bg-primary/10 transition-all duration-200"
              >
                <Link
                  href="/auth/sign-in"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
              </Button>
              <Button
                asChild
                className="justify-start h-auto p-2"
              >
                <Link
                  href="/auth/sign-up"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
