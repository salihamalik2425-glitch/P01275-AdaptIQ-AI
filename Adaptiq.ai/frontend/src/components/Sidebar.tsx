"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Brain, FileUp, HelpCircle, Home, MessageCircle, Mic2, Settings, Sparkles, Target, X } from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Learning Twin", href: "/learning-twin", icon: Brain },
  { label: "Ask AI", href: "/ask", icon: MessageCircle },
  { label: "Quiz", href: "/quiz", icon: Target },
  { label: "My Materials", href: "/upload", icon: FileUp },
  { label: "Lectures", href: "/lecture", icon: Mic2 },
  { label: "Progress", href: "/progress", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[274px] flex-col border-r border-slate-200 bg-white px-4 py-5 shadow-soft transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-10 flex items-center justify-between px-3">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}><span className="grid h-9 w-9 place-items-center rounded-xl bg-ink font-display text-lg font-bold text-white shadow-glow">A</span><span className="font-display text-lg font-bold tracking-tight text-ink">Adapt<span className="text-primary">IQ</span></span></Link>
          <button className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-ink lg:hidden" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</div>
        <nav className="grid gap-1">{navigation.map(({ label, href, icon: Icon }) => <Link className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition ${pathname === href ? "bg-indigo-50 text-primary shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-ink"}`} href={href} key={href} onClick={onClose}><Icon size={18} strokeWidth={1.8} className={pathname === href ? "text-primary" : "text-slate-400 group-hover:text-ink"} /><span>{label}</span>{pathname === href && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}</Link>)}</nav>
        <div className="mt-auto"><div className="relative overflow-hidden rounded-2xl bg-ink p-4 text-white"><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-indigo-400/30" /><Sparkles size={17} className="relative text-indigo-300" /><p className="relative my-2 max-w-[180px] text-[11px] leading-relaxed text-slate-300">Your Learning Twin gets smarter every time you learn.</p><Link className="relative text-[11px] font-bold text-indigo-300 hover:text-white" href="/learning-twin">See how it works <span aria-hidden="true">↗</span></Link></div><div className="mt-4 flex items-center gap-3 border-t border-slate-200 px-2 pt-4"><div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-primary">AM</div><div><strong className="block text-xs text-ink">Alex Morgan</strong><span className="text-[10px] text-slate-400">Free plan</span></div><HelpCircle size={16} className="ml-auto text-slate-300" /></div></div>
      </aside>
      {isOpen && <div className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm lg:hidden" onClick={onClose} />}
    </>
  );
}
