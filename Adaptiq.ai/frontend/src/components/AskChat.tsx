"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, LoaderCircle, Sparkles, UserRound } from "lucide-react";
import { askAdaptIQ, getLearningTwin, type LearningTwin } from "@/lib/api";

type Message = { role: "assistant" | "user"; content: string };
const starters = ["Explain Newton's Second Law step by step", "Help me understand photosynthesis", "Show me where to start with algebra"];

function profileSignal(value: string) {
  return value === "not_set" ? "Not set" : value.replaceAll("_", " ");
}

export function AskChat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [twin, setTwin] = useState<LearningTwin | null>(null);
  const [profileError, setProfileError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isCurrent = true;
    getLearningTwin()
      .then((profile) => { if (isCurrent) setTwin(profile); })
      .catch((requestError) => { if (isCurrent) setProfileError(requestError instanceof Error ? requestError.message : "Profile signals are unavailable."); });
    return () => { isCurrent = false; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  async function ask(questionText: string) {
    const trimmedQuestion = questionText.trim();
    if (!trimmedQuestion || isLoading) return;
    setMessages((current) => [...current, { role: "user", content: trimmedQuestion }]);
    setQuestion("");
    setError("");
    setIsLoading(true);
    try {
      const response = await askAdaptIQ(trimmedQuestion);
      setMessages((current) => [...current, { role: "assistant", content: response.answer }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_350px]">
      <section className="flex min-h-[650px] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
        <div className="flex items-start justify-between gap-5 border-b border-slate-100 pb-5"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Personal tutor</div><h2 className="font-display text-2xl font-bold tracking-tight text-ink">Ask AdaptIQ AI</h2><p className="mt-2 text-sm text-slate-500">An explanation shaped by your current Learning Twin.</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-primary"><Sparkles size={21} /></div></div>

        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-indigo-900"><Sparkles size={14} /> Personalized using your Learning Twin</div>
          <p className="mt-1 text-xs leading-5 text-indigo-800">{twin ? `${profileSignal(twin.learning_style)} learner · ${profileSignal(twin.explanation_style)} explanations · ${twin.weak_topics.length ? `Practice: ${twin.weak_topics.slice(0, 2).join(", ")}` : "No weak topics recorded"}` : profileError ? "Profile signals could not be loaded; Ask AI requests still use the existing chat service." : "Loading your profile signals..."}</p>
        </div>

        <div className="flex flex-1 flex-col gap-4 py-7" aria-live="polite">
          {messages.length === 0 ? <div className="m-auto max-w-sm text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-primary"><Bot size={28} /></div><h3 className="mt-5 font-display text-xl font-bold text-ink">Where should we start?</h3><p className="mt-2 text-sm leading-6 text-slate-500">Choose a question below or ask about a concept that feels unclear.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{starters.map((starter) => <button key={starter} type="button" onClick={() => void ask(starter)} disabled={isLoading} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-indigo-200 hover:text-primary disabled:opacity-50">{starter}</button>)}</div></div> : messages.map((message, index) => <div className={`flex items-end gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`} key={`${message.role}-${index}`}><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${message.role === "assistant" ? "bg-indigo-50 text-primary" : "bg-slate-100 text-slate-600"}`}>{message.role === "assistant" ? <Bot size={15} /> : <UserRound size={15} />}</div><div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-br-md bg-ink text-white" : "rounded-bl-md bg-slate-50 text-slate-700"}`}>{message.content}</div></div>)}
          {isLoading && <div className="flex items-center gap-3 text-sm text-slate-500"><div className="grid h-8 w-8 place-items-center rounded-full bg-indigo-50 text-primary"><Bot size={15} /></div><LoaderCircle className="animate-spin" size={15} /> Thinking with your Learning Twin...</div>}
          {error && <p role="alert" className="ml-11 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div ref={bottomRef} />
        </div>

        <form className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100" onSubmit={submitQuestion}><label className="sr-only" htmlFor="ask-question">Ask a question</label><textarea id="ask-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void ask(question); } }} placeholder="Ask anything about what you're learning..." rows={2} className="max-h-32 min-h-12 flex-1 resize-y bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-slate-400" /><button type="submit" disabled={!question.trim() || isLoading} aria-label="Send question" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"><ArrowUp size={18} /></button></form>
        <p className="mt-2 text-center text-[10px] text-slate-400">AdaptIQ AI can make mistakes. Check important information.</p>
      </section>

      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center gap-2"><Sparkles size={17} className="text-primary" /><h2 className="font-display text-lg font-bold text-ink">Your Learning Twin</h2></div>{twin ? <><div className="grid gap-4 text-sm"><Signal label="Learning style" value={profileSignal(twin.learning_style)} /><Signal label="Explanation preference" value={profileSignal(twin.explanation_style)} /><Signal label="Confidence" value={`${twin.confidence_score}%`} /></div><div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Focus areas</p>{twin.weak_topics.length ? <ul className="mt-2 space-y-2">{twin.weak_topics.map((topic) => <li key={topic} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{topic}</li>)}</ul> : <p className="mt-2 text-xs text-slate-500">No practice areas recorded yet.</p>}</div></> : <p className="text-sm text-slate-500">{profileError || "Loading profile..."}</p>}</aside>
    </div>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return <div><span className="block text-xs text-slate-400">{label}</span><strong className="mt-1 block capitalize text-ink">{value}</strong></div>;
}