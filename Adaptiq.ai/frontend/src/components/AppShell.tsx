"use client";

import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "./Sidebar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/learning-twin": "Learning Twin",
  "/ask": "Ask AI",
  "/quiz": "Quiz",
  "/upload": "My Materials",
  "/lecture": "Lectures",
  "/progress": "Progress",
  "/settings": "Settings",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? "Workspace";

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-canvas/90 px-5 backdrop-blur-xl sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-indigo-200 hover:text-primary lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={19} /></button>
            <div className="text-xs text-slate-400">Workspace <span className="mx-1.5">/</span> <strong className="font-semibold text-ink">{pageTitle}</strong></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-white hover:text-ink" aria-label="Search"><Search size={18} /></button>
            <button className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-white hover:text-ink" aria-label="Notifications"><Bell size={18} /><span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-violet-500 ring-2 ring-canvas" /></button>
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-[11px] font-bold text-primary">AM</div><span className="hidden text-xs font-semibold text-ink sm:block">Alex Morgan</span></div>
          </div>
        </header>
        <div className="px-5 pb-12 pt-8 sm:px-8 lg:px-12">{children}</div>
      </main>
    </div>
  );
}