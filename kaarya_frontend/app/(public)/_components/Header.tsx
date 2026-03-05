"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Container } from "./Container";
import { NavLink } from "./NavLink";

function MobileNavIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 overflow-visible stroke-slate-700"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path
        d="M0 1H14M0 7H14M0 13H14"
        className={cn(
          "origin-center transition-all duration-300",
          open && "scale-90 opacity-0"
        )}
      />
      <path
        d="M2 2L12 12M12 2L2 12"
        className={cn(
          "origin-center transition-all duration-300",
          !open && "scale-90 opacity-0"
        )}
      />
    </svg>
  );
}

function MobileNavigation({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="relative z-10 flex h-8 w-8 items-center justify-center transition-transform duration-200 hover:scale-110"
        aria-label="Toggle Navigation"
        onClick={() => setOpen(!open)}
      >
        <MobileNavIcon open={open} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-slate-300/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-4 flex w-56 origin-top animate-fade-in-up flex-col rounded-2xl bg-white p-4 text-lg tracking-tight text-slate-900 shadow-xl ring-1 ring-slate-900/5">
            <Link
              href="#features"
              className="block w-full rounded-lg p-2 transition-colors hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="block w-full rounded-lg p-2 transition-colors hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Testimonials
            </Link>
            <Link
              href="#pricing"
              className="block w-full rounded-lg p-2 transition-colors hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Pricing
            </Link>
            <hr className="m-2 border-slate-300/40" />
            {isLoggedIn ? (
              <Link
                href="/overview"
                className="block w-full rounded-lg p-2 transition-colors hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="block w-full rounded-lg p-2 transition-colors hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function Header({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow,padding] duration-500 ease-out",
        scrolled
          ? "bg-white/80 py-4 shadow-sm backdrop-blur-xl"
          : "bg-transparent py-6"
      )}
    >
      <Container>
        <nav className="relative z-50 flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <Link
              href="/"
              aria-label="Home"
              className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80"
            >
              <img src="/kaarya.svg" alt="Kaarya" width={36} height={36} />
              <span className="text-xl font-semibold tracking-tight text-slate-900">
                Kaarya<span className="text-primary">.ai</span>
              </span>
            </Link>

            <div className="hidden md:flex md:gap-x-6">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#testimonials">Testimonials</NavLink>
              <NavLink href="#pricing">Pricing</NavLink>
            </div>
          </div>

          <div className="flex items-center gap-x-5 md:gap-x-8">
            {isLoggedIn ? (
              <Button asChild>
                <Link href="/overview">Dashboard</Link>
              </Button>
            ) : (
              <>
                <div className="hidden md:block">
                  <NavLink href="/sign-in">Sign in</NavLink>
                </div>
                <Button asChild>
                  <Link href="/sign-up">Get started now</Link>
                </Button>
              </>
            )}

            <div className="-mr-1 md:hidden">
              <MobileNavigation isLoggedIn={isLoggedIn} />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}
