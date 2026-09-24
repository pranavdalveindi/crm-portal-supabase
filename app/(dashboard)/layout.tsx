"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { logout } from "@/src/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  /*
   * While authentication is loading
   */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />

          <p className="text-sm text-slate-500">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  /*
   * If there is no authenticated user,
   * send them back to login.
   */
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    return null;
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  const canViewRules =
    user.role === "developer" ||
    user.role === "panel_manager";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ================================================= */}
      {/* DESKTOP SIDEBAR                                  */}
      {/* ================================================= */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        {/* ================================================= */}
        {/* LOGO / HEADER                                     */}
        {/* ================================================= */}

        <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-6">
          <Link
            href="/call-list"
            className="flex items-center gap-3"
          >
            <img
              src="/indi-logo.png"
              alt="Inditronics"
              className="h-9 w-9 object-contain"
            />

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Inditronics
              </p>

              <p className="text-xs text-slate-400">
                CRM Portal
              </p>
            </div>
          </Link>
        </div>

        {/* ================================================= */}
        {/* NAVIGATION                                        */}
        {/* ================================================= */}

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Operations
          </p>

          <div className="space-y-1">
            <SidebarLink
                href="/call-list"
                active={pathname.startsWith("/call-list")}
                icon={<CallListIcon />}
            >
                Call List
            </SidebarLink>

            {user.role === "panel_manager" && (
                <SidebarLink
                href="/kpi"
                active={pathname.startsWith("/kpi")}
                icon={<KPIIcon />}
                >
                KPIs
                </SidebarLink>
            )}

            {canViewRules && (
                <SidebarLink
                href="/rules"
                active={pathname.startsWith("/rules")}
                icon={<RulesIcon />}
                >
                Anomaly Rules
                </SidebarLink>
            )}
            </div>
        </nav>

        {/* ================================================= */}
        {/* USER PROFILE                                      */}
        {/* ================================================= */}

        <div className="shrink-0 border-t border-slate-200 p-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              {/* Avatar */}

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {getInitials(user.name)}
              </div>

              {/* User details */}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user.name}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user.email}
                </p>

                <p className="mt-0.5 text-[11px] font-medium capitalize text-blue-600">
                  {formatRole(user.role)}
                </p>
              </div>
            </div>

            {/* Logout */}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogoutIcon />

              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>
          </div>
        </div>
      </aside>

      {/* ================================================= */}
      {/* MOBILE HEADER                                     */}
      {/* ================================================= */}

      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link
          href="/call-list"
          className="flex items-center gap-3"
        >
          <img
            src="/indi-logo.png"
            alt="Inditronics"
            className="h-9 w-9 object-contain"
          />

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Inditronics
            </p>

            <p className="text-xs text-slate-400">
              CRM Portal
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen((open) => !open)
          }
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <MenuIcon />
        </button>
      </div>

      {/* ================================================= */}
      {/* MOBILE NAVIGATION                                 */}
      {/* ================================================= */}

      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 z-30 border-b border-slate-200 bg-white p-3 shadow-lg lg:hidden">
          <nav className="space-y-1">
            <MobileSidebarLink
                href="/call-list"
                active={pathname.startsWith("/call-list")}
                onClick={() =>
                setMobileMenuOpen(false)
                }
            >
                Call List
            </MobileSidebarLink>

            {user.role === "panel_manager" && (
                <MobileSidebarLink
                href="/kpi"
                active={pathname.startsWith("/kpi")}
                onClick={() =>
                    setMobileMenuOpen(false)
                }
                >
                KPIs
                </MobileSidebarLink>
            )}

            {canViewRules && (
                <MobileSidebarLink
                href="/rules"
                active={pathname.startsWith("/rules")}
                onClick={() =>
                    setMobileMenuOpen(false)
                }
                >
                Anomaly Rules
                </MobileSidebarLink>
            )}

            <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-2 flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
                {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>
            </nav>
        </div>
      )}

      {/* ================================================= */}
      {/* MAIN CONTENT                                      */}
      {/* ================================================= */}

      <main className="min-h-screen lg:ml-64">
        <div className="mx-auto min-h-screen max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

/* ========================================================= */
/* DESKTOP SIDEBAR LINK                                      */
/* ========================================================= */

function SidebarLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {icon}

      <span>{children}</span>
    </Link>
  );
}

/* ========================================================= */
/* MOBILE LINK                                              */
/* ========================================================= */

function MobileSidebarLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </Link>
  );
}

/* ========================================================= */
/* HELPERS                                                   */
/* ========================================================= */

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

function formatRole(role: string) {
  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

/* ========================================================= */
/* ICONS                                                     */
/* ========================================================= */

function KPIIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-9" />
    </svg>
  );
}

function CallListIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
      />

      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  );
}

function RulesIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 3 4 6v5c0 5 3.4 8.8 8 10 4.6-1.2 8-5 8-10V6l-8-3Z" />

      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />

      <path d="m16 17 5-5-5-5" />

      <path d="M21 12H9" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}
