"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/UseAuth";


export default function Header() {
  const pathname = usePathname();
  const { auth } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo and title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
            H
          </div>
          <span className="font-semibold text-slate-800">HazardWire</span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          <NavLink href="/map" label="Map" pathname={pathname} />
          <NavLink href="/reports" label="Reports" pathname={pathname} />
          <NavLink href="/submit" label="Submit" pathname={pathname} />
          <NavLink href="/my-reports" label="My Reports" pathname={pathname} />
          <NavLink href="/organizations" label="Organizations" pathname={pathname} />
          <NavLink href={auth.token ? "/org-profile" : "/org-login"} label={auth.token ? "Dashboard" : "Org Login"} pathname={pathname} />
        </nav>

        {/* Auth state */}
        <div className="text-sm text-slate-500 shrink-0 hidden sm:block">
          {auth.token ? (
            <span className="text-emerald-600 font-medium">{auth.email}</span>
          ) : (
            <span>Public</span>
          )}
        </div>
      </div>
    </header>
  );
}


function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return <Link
    key={href}
    href={href}
    className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
      isActive
        ? href === "/submit"
          ? "bg-orange-500 text-white"
          : "bg-slate-800 text-white"
        : "text-slate-600 hover:bg-slate-100"
    }`}
  >
    {label}
  </Link>
}
