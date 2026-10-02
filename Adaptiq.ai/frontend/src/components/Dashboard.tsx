"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Brain, BookOpen, Clock3, FileText, Flame, LoaderCircle, MessageCircle, Mic2, Play, Target, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getHistory, getLearningTwin, getProgress, type HistoryEntry, type LearningTwin, type ProgressResponse } from "@/lib/api";
import { Badge, IconTile, ProgressBar } from "./ui";

export function Dashboard() {
  const [twin, setTwin] = useState<LearningTwin | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    Promise.all([getLearningTwin(), getProgress(), getHistory()])
      .then(([profile, summary, entries]) => {
        if (!isCurrent) return;
        setTwin(profile);
        setProgress(summary);
        setHistory(entries.slice(0, 4));
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError instanceof Error ? requestError.message : "Could not load dashboard data.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-[1440px]">
      <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your adaptive learning workspace</div><h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">{greeting}, Student</h1><p className="mt-3 text-sm text-slate-500">Here&apos;s how your learning is progressing.</p></div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm"><Flame size={15} className="text-orange-500" /> {progress?.learning_streak ?? 0} day streak</div>
      </section>

      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {isLoading ? (
        <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading your learning data...</div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Metric icon={Brain} label="Learning Twin" value={twin ? `${twin.confidence_score}%` : "--"} detail="Confidence" tone="bg-indigo-50 text-primary" />
            <Metric icon={Target} label="Quiz score" value={progress?.quizzes_completed ? `${progress.average_score}%` : "--"} detail={progress?.quizzes_completed ? `${progress.quizzes_completed} quizzes` : "No quizzes yet"} tone="bg-emerald-50 text-emerald-700" />
            <Metric icon={Trophy} label="Topics studied" value={String(progress?.topics_studied ?? 0)} detail="Across your quizzes" tone="bg-amber-50 text-amber-700" />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-center justify-between"><div><div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><Brain size={14} /> Adaptive profile</div><h2 className="font-display text-xl font-bold text-ink">Your Learning Profile</h2></div><Link className="flex items-center gap-1 text-xs font-bold text-primary hover:text-indigo-700" href="/learning-twin">View twin <ArrowUpRight size={14} /></Link></div>
              {twin && <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="relative grid h-32 w-32 place-items-center rounded-full" style={{ background: `conic-gradient(#4f46e5 0 ${twin.confidence_score}%, #eef2ff ${twin.confidence_score}% 100%)` }}><div className="grid h-24 w-24 place-items-center rounded-full bg-white"><span className="font-display text-3xl font-bold text-ink">{twin.confidence_score}<small className="block text-center font-sans text-[9px] font-semibold uppercase tracking-wider text-slate-400">confidence</small></span></div></div>
                <div><div className="grid gap-3 text-sm sm:grid-cols-2"><ProfileLine label="Learning style" value={twin.learning_style} /><ProfileLine label="Explanation style" value={twin.explanation_style} /></div><div className="mt-4 flex flex-wrap gap-2"><TopicBadges label="Strong" topics={twin.strong_topics} tone="emerald" /><TopicBadges label="Needs practice" topics={twin.weak_topics} tone="amber" /></div></div>
              </div>}
              {twin && <div className="mt-6"><div className="mb-2 flex justify-between text-xs"><span className="font-semibold text-slate-600">Confidence</span><span className="font-bold text-ink">{twin.confidence_score}%</span></div><ProgressBar value={twin.confidence_score} /></div>}
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between"><div><div className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">Learning history</div><h2 className="font-display text-xl font-bold text-ink">Recent activity</h2></div><Link className="text-xs font-bold text-primary hover:text-indigo-700" href="/progress">See all</Link></div>
              {history.length ? <div className="space-y-4">{history.map((entry) => <Activity key={entry.id} entry={entry} />)}</div> : <div className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">Your recent quiz activity will appear here.</div>}
            </article>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-4 flex items-center gap-2"><Target size={18} className="text-primary" /><h2 className="font-display text-lg font-bold text-ink">Recurring mistakes</h2></div>{twin?.recurring_mistakes.length ? <ul className="space-y-2">{twin.recurring_mistakes.slice(0, 5).map((mistake) => <li key={mistake} className="rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-800">{mistake}</li>)}</ul> : <p className="text-sm text-slate-500">No recurring mistakes recorded yet. Complete a quiz to start building this insight.</p>}</article>
            <article className="rounded-2xl bg-ink p-5 text-white shadow-soft sm:p-6"><div className="mb-5 text-xs font-bold uppercase tracking-wider text-indigo-300">Quick actions</div><h2 className="font-display text-xl font-bold">Continue your learning loop</h2><div className="mt-5 grid grid-cols-2 gap-2"><QuickAction href="/ask" icon={MessageCircle} label="Ask AI" /><QuickAction href="/quiz" icon={Play} label="Take quiz" /><QuickAction href="/upload" icon={FileText} label="Upload PDF" /><QuickAction href="/lecture" icon={Mic2} label="Lecture" /></div></article>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ icon, label, value, detail, tone }: { icon: LucideIcon; label: string; value: string; detail: string; tone: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><IconTile icon={icon} className={tone} /><ArrowUpRight size={16} className="text-slate-300" /></div><p className="mt-5 text-xs font-semibold text-slate-500">{label}</p><div className="mt-1 flex items-end justify-between gap-2"><strong className="font-display text-2xl font-bold text-ink">{value}</strong><span className="text-right text-[10px] font-medium text-slate-400">{detail}</span></div></article>;
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return <div><span className="block text-xs text-slate-400">{label}</span><strong className="mt-1 block text-sm capitalize text-ink">{value === "not_set" ? "Not set yet" : value.replaceAll("_", " ")}</strong></div>;
}

function TopicBadges({ label, topics, tone }: { label: string; topics: string[]; tone: "emerald" | "amber" }) {
  const styles = tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
  return <div className="flex flex-wrap items-center gap-1.5"><span className="mr-1 text-[10px] font-bold uppercase text-slate-400">{label}</span>{topics.length ? topics.slice(0, 3).map((topic) => <Badge key={topic} tone={tone}>{topic}</Badge>) : <span className="text-xs text-slate-400">None yet</span>}{!topics.length && <span className={styles} />}</div>;
}

function Activity({ entry }: { entry: HistoryEntry }) {
  const Icon = entry.activity_type === "quiz_completed" ? Trophy : BookOpen;
  const label = entry.activity_type.replaceAll("_", " ");
  return <div className="flex items-center gap-3"><IconTile icon={Icon} className="bg-emerald-50 text-emerald-700" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold capitalize text-ink">{label}</p><p className="mt-0.5 truncate text-xs text-slate-500">{entry.topic ?? "Learning activity"} · {new Date(entry.created_at).toLocaleString()}</p></div>{entry.performance !== null && <strong className="text-xs text-emerald-700">{Math.round(entry.performance)}%</strong>}</div>;
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return <Link href={href} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/10 p-3 text-xs font-semibold text-slate-200 transition hover:bg-white/20"><Icon size={16} className="text-indigo-300" />{label}</Link>;
}