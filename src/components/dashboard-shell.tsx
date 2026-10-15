"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/logo";

export type NavIcon =
  | "overview"
  | "employees"
  | "clients"
  | "tasks"
  | "my-tasks"
  | "calendar"
  | "requests"
  | "assign"
  | "payouts"
  | "payments"
  | "finance"
  | "expenses"
  | "subscriptions"
  | "dharam"
  | "jobs"
  | "reports";

const iconPaths: Record<NavIcon, React.ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  employees: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  clients: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </>
  ),
  tasks: (
    <>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  "my-tasks": (
    <>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </>
  ),
  requests: (
    <>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </>
  ),
  assign: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </>
  ),
  payouts: (
    <>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </>
  ),
  payments: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </>
  ),
  finance: (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M8 16v-5" />
      <path d="M13 16V8" />
      <path d="M18 16v-8" />
    </>
  ),
  expenses: (
    <>
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </>
  ),
  subscriptions: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </>
  ),
  dharam: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  ),
  jobs: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M5.5 15.5c.6-1.6 1.9-2.5 3.5-2.5s2.9.9 3.5 2.5" />
      <path d="M15 9h4M15 13h4" />
    </>
  ),
  reports: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 15h6" />
      <path d="M9 11h2" />
    </>
  ),
};

function Icon({ name, className }: { name: NavIcon; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {iconPaths[name]}
    </svg>
  );
}

export type ShellUser = {
  name: string;
  email: string;
  role: string;
};

export type PayBox = {
  perPostPay: number | null;
  completedCount: number;
  totalEarned?: number;
  monthEarned?: number;
  monthBonus?: number;
};

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  badge?: number;
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

export function DashboardShell({
  user,
  nav,
  payBox,
  children,
}: {
  user: ShellUser;
  nav: NavSection[];
  payBox?: PayBox;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const renderItems = (items: NavItem[]) =>
    items.map((item) => {
      const active = pathname === item.href || pathname.startsWith(item.href + "/");
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition duration-200 ${
            active
              ? "bg-elevated font-semibold text-ink shadow-soft ring-1 ring-line"
              : "font-medium text-muted hover:bg-hover hover:text-ink"
          }`}
        >
          <Icon name={item.icon} className="h-4 w-4 shrink-0" />
          {item.label}
          {!!item.badge && item.badge > 0 && (
            <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {item.badge}
            </span>
          )}
        </Link>
      );
    });

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <Logo size={44} className="shadow-soft" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-ink">RB Social Branding</p>
          <p className="text-xs text-faint">
            {user.role === "ADMIN"
              ? "Admin workspace"
              : user.role === "MANAGER"
                ? "Manager workspace"
                : user.role === "ACCOUNTANT"
                  ? "Finance workspace"
                  : "Employee workspace"}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {nav.map((section, i) => (
          <div key={i} className={section.label ? "pt-5" : i > 0 ? "pt-3" : ""}>
            {section.label && (
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-faint">
                {section.label}
              </p>
            )}
            <div className="space-y-1">{renderItems(section.items)}</div>
          </div>
        ))}
      </nav>

      {payBox && (
        <div className="mx-3 mb-3 rounded-2xl border border-line bg-elevated p-3.5 shadow-soft md:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ok-soft text-ok">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2.5" />
                <path d="M5.5 12h.01" />
                <path d="M18.5 12h.01" />
              </svg>
            </span>
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Earnings</p>
          </div>
          <p className="mt-2 text-lg font-bold tracking-tight text-ink">
            ₹{(
              payBox.totalEarned ??
              (payBox.perPostPay ?? 0) * payBox.completedCount
            ).toLocaleString("en-IN")}
            <span className="text-xs font-medium text-faint"> earned</span>
          </p>
        </div>
      )}

      <div className="p-3">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-elevated p-2.5 shadow-soft">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-panel text-xs font-bold text-ink ring-1 ring-line">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-faint">{user.email}</p>
          </div>
          <form action={logout}>
            <button
              title="Log out"
              className="rounded-xl p-2 text-faint transition duration-200 hover:bg-hover hover:text-ink"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="theme-dark min-h-screen bg-canvas text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-panel md:block">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-panel/90 px-4 py-3 backdrop-blur md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-xl p-1.5 text-ink transition hover:bg-hover"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        </button>
        <Logo size={32} rounded="rounded-lg" />
        <span className="text-sm font-bold tracking-tight text-ink">RB Social Branding</span>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-line bg-panel shadow-lift">
            {sidebar}
          </aside>
        </div>
      )}

      <main className="md:pl-64">
        <div className="px-6 py-10 lg:px-10">
          {payBox && (
            <div className="mb-6 hidden justify-end md:flex">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-elevated to-elevated p-[1px] shadow-lift">
                <div className="rounded-2xl bg-elevated/90 px-5 py-3.5 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-soft">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden>
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                        <circle cx="12" cy="12" r="2.5" />
                        <path d="M5.5 12h.01" />
                        <path d="M18.5 12h.01" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                        Earnings
                      </p>
                      <p className="text-lg font-extrabold leading-tight tracking-tight text-ink">
                        ₹{(
                          payBox.totalEarned ??
                          (payBox.perPostPay ?? 0) * payBox.completedCount
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                    {payBox.monthEarned != null && (
                      <div className="ml-2 border-l border-line pl-3 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                          This month
                        </p>
                        <p className="text-sm font-bold text-ink">
                          ₹{payBox.monthEarned.toLocaleString("en-IN")}
                          {payBox.monthBonus ? (
                            <span className="text-ok">
                              {" "}
                              +₹{payBox.monthBonus.toLocaleString("en-IN")} 🎁
                            </span>
                          ) : null}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
