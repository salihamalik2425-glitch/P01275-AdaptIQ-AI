"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Check,
  FileText,
  Headphones,
  LoaderCircle,
  Mic2,
  RefreshCw,
  Sparkles,
  Target,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import {
  generateQuiz,
  getHistory,
  getLearningTwin,
  getProgress,
  submitQuiz,
  type HistoryEntry,
  type LearningTwin,
  type ProgressResponse,
  type QuizResponse,
  type QuizSubmitResponse,
} from "@/lib/api";
import { Badge, ProgressBar } from "./ui";

type UploadStatus = { tone: "info" | "success" | "error"; message: string } | null;
type UploadedDocument = { name: string; uploadedAt: string; message: string };

export function LearningTwinView() {
  const [twin, setTwin] = useState<LearningTwin | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError("");
    Promise.all([getLearningTwin(), getHistory(), getProgress()])
      .then(([profile, entries, summary]) => {
        if (!isCurrent) return;
        setTwin(profile);
        setHistory(entries);
        setProgress(summary);
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError instanceof Error ? requestError.message : "Could not load your Learning Twin.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, [refreshKey]);

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageIntro eyebrow="Your adaptive profile" title="Your Learning Twin" description="An evolving profile of how you learn." />
        <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="mb-8 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-indigo-200 hover:text-primary" aria-label="Refresh Learning Twin">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading your profile...</div>
      ) : error ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</p>
      ) : twin && (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-3xl bg-ink p-6 text-white shadow-soft sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300"><Sparkles size={14} /> Living learning profile</div>
                <h2 className="mt-3 font-display text-2xl font-bold">Your next step, made personal.</h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">Quiz results shape this profile, and your profile guides future explanations.</p>
              </div>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-indigo-200"><WandSparkles size={22} /></div>
            </div>
            <div className="mt-9 flex flex-col gap-7 sm:flex-row sm:items-center">
              <div className="relative grid h-40 w-40 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#818cf8 0 ${twin.confidence_score}%, #263248 ${twin.confidence_score}% 100%)` }}>
                <div className="grid h-32 w-32 place-items-center rounded-full bg-ink"><strong className="font-display text-5xl">{twin.confidence_score}<small className="block text-center font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">confidence</small></strong></div>
              </div>
              <div className="flex-1">
                <div className="mb-2 flex justify-between text-xs"><span className="text-slate-400">Quiz average</span><span className="font-bold text-indigo-300">{progress?.average_score ?? 0}%</span></div>
                <ProgressBar value={progress?.average_score ?? 0} color="bg-indigo-400" />
                <div className="mt-6 grid gap-4 text-xs sm:grid-cols-2">
                  <ProfileValue label="Learning style" value={twin.learning_style} />
                  <ProfileValue label="Explanation preference" value={twin.explanation_style} />
                  <ProfileValue label="Quizzes completed" value={String(progress?.quizzes_completed ?? 0)} />
                  <ProfileValue label="Last updated" value={new Date(twin.updated_at).toLocaleDateString()} />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <TopicCard title="Strong topics" topics={twin.strong_topics} tone="emerald" />
            <TopicCard title="Needs practice" topics={twin.weak_topics} tone="amber" />
            <TopicCard title="Recurring mistakes" topics={twin.recurring_mistakes} tone="violet" />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">A profile that evolves</p><h2 className="mt-1 font-display text-xl font-bold text-ink">Learning Twin history</h2></div><span className="text-xs text-slate-400">{history.length} activities</span></div>
            {history.length ? (
              <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {history.map((entry) => <li key={entry.id} className="border-l-2 border-indigo-100 py-1 pl-4"><time className="text-[11px] font-semibold text-primary">{new Date(entry.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time><p className="mt-1 text-sm font-semibold capitalize text-ink">{entry.activity_type.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-500">{entry.topic ?? "Learning activity"}{entry.performance !== null ? ` · ${Math.round(entry.performance)}%` : ""}</p></li>)}
              </ol>
            ) : <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">Your learning history will appear here after your first quiz.</p>}
          </section>
        </div>
      )}
    </div>
  );
}

function ProfileValue({ label, value }: { label: string; value: string }) {
  return <div><span className="block text-slate-400">{label}</span><strong className="mt-1 block capitalize text-white">{value === "not_set" ? "Not set yet" : value.replaceAll("_", " ")}</strong></div>;
}

export function QuizView() {
  const [topic, setTopic] = useState("Newton's Second Law");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState<5 | 10>(5);
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const correctCount = quiz?.questions.reduce((count, question, index) => count + (answers[index] === question.correct_answer ? 1 : 0), 0) ?? 0;
  const mistakes = quiz?.questions.flatMap((question, index) => answers[index] !== question.correct_answer ? [`${quiz.topic}: ${question.question}`] : []) ?? [];
  const activeQuestion = quiz?.questions[currentIndex];
  const allAnswered = Boolean(quiz && quiz.questions.every((_, index) => Boolean(answers[index])));

  async function startQuiz() {
    if (!topic.trim() || isGenerating) return;
    setIsGenerating(true);
    setError("");
    try {
      const generated = await generateQuiz(topic.trim(), difficulty, questionCount);
      if (!generated.questions.length) throw new Error("The quiz service returned no questions.");
      setQuiz(generated);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not generate the quiz.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function finishQuiz() {
    if (!quiz || !allAnswered || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const submitted = await submitQuiz(quiz.topic, quiz.questions.length, correctCount, mistakes);
      setResult(submitted);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not submit quiz results.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result && quiz) {
    return (
      <div className="mx-auto max-w-[900px]">
        <PageIntro eyebrow="Performance review" title="Quiz complete" description="Your results are recorded and your Learning Twin has been updated." />
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-9">
          <div className="flex flex-col items-center border-b border-slate-100 pb-7 text-center"><div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Target size={34} /></div><h2 className="mt-4 font-display text-3xl font-bold text-ink">{correctCount} / {quiz.questions.length}</h2><p className="mt-1 text-sm text-slate-500">{result.score}% on {quiz.topic}</p><p className="mt-3 text-sm font-semibold text-emerald-700">Your Learning Twin has been updated.</p></div>
          <div className="grid gap-5 py-7 md:grid-cols-2"><TopicCard title="Areas needing attention" topics={result.learning_twin.weak_topics} tone="amber" /><TopicCard title="Mistakes to revisit" topics={result.learning_twin.recurring_mistakes} tone="violet" /></div>
          <div className="space-y-3">
            {quiz.questions.map((question, index) => {
              const correct = answers[index] === question.correct_answer;
              return <article key={`${index}-${question.question}`} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start gap-3"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${correct ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{correct ? <Check size={14} /> : "!"}</span><div><h3 className="text-sm font-semibold text-ink">{question.question}</h3><p className="mt-2 text-xs text-slate-500">Your answer: {answers[index]}</p>{!correct && <p className="mt-1 text-xs font-medium text-emerald-700">Correct answer: {question.correct_answer}</p>}<p className="mt-2 text-sm leading-5 text-slate-600">{question.explanation}</p></div></div></article>;
            })}
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/learning-twin" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700">View Learning Twin <ArrowRight size={16} /></Link><button type="button" onClick={() => { setQuiz(null); setResult(null); setError(""); }} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Create another quiz</button></div>
        </section>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="mx-auto max-w-[900px]">
        <PageIntro eyebrow="Practice with purpose" title="Take a quiz" description="Generate a topic-focused quiz and use the results to update your Learning Twin." />
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-9">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-ink sm:col-span-2">Topic<input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Newton's Second Law" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100" /></label>
            <label className="text-sm font-semibold text-ink">Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
            <label className="text-sm font-semibold text-ink">Number of questions<select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value) as 5 | 10)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal"><option value={5}>5 questions</option><option value={10}>10 questions</option></select></label>
          </div>
          {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button type="button" onClick={startQuiz} disabled={!topic.trim() || isGenerating} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{isGenerating ? <><LoaderCircle className="animate-spin" size={16} /> Generating...</> : <>Generate quiz <ArrowRight size={16} /></>}</button>
        </section>
      </div>
    );
  }

  if (!activeQuestion) return null;
  const progressValue = Math.round(((currentIndex + (answers[currentIndex] ? 1 : 0)) / quiz.questions.length) * 100);

  return (
    <div className="mx-auto max-w-[900px]">
      <PageIntro eyebrow="Practice with purpose" title={quiz.topic} description="Answer each question, review your choices, then submit to update your Learning Twin." />
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-9">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center"><div><Badge tone="violet">{difficulty} · {quiz.questions.length} questions</Badge><p className="mt-3 text-sm font-semibold text-slate-500">Question <span className="text-ink">{currentIndex + 1}</span> of {quiz.questions.length}</p></div><div className="w-full sm:w-44"><div className="mb-2 flex justify-between text-[10px] font-bold text-slate-400"><span>Progress</span><span>{progressValue}%</span></div><ProgressBar value={progressValue} /></div></div>
        <div className="py-9"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-primary"><Target size={22} /></div><h2 className="max-w-2xl font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">{activeQuestion.question}</h2><div className="mt-7 grid gap-3">{activeQuestion.options.map((option, index) => <button key={`${index}-${option}`} type="button" onClick={() => setAnswers((current) => ({ ...current, [currentIndex]: option }))} className={`flex items-center gap-4 rounded-2xl border p-4 text-left text-sm font-medium transition ${answers[currentIndex] === option ? "border-primary bg-indigo-50 text-primary ring-2 ring-indigo-100" : "border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50"}`}><span className={`grid h-7 w-7 place-items-center rounded-full border text-xs ${answers[currentIndex] === option ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-400"}`}>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div></div>
        {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6"><button type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 disabled:opacity-40"><ArrowLeft size={14} /> Previous</button><span className="text-xs font-semibold text-slate-500">{Object.keys(answers).length}/{quiz.questions.length} answered</span>{currentIndex < quiz.questions.length - 1 ? <button type="button" disabled={!answers[currentIndex]} onClick={() => setCurrentIndex((index) => index + 1)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">Next <ArrowRight size={14} /></button> : <button type="button" disabled={!allAnswered || isSubmitting} onClick={finishQuiz} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? <><LoaderCircle className="animate-spin" size={14} /> Saving...</> : "Submit quiz"}</button>}</div>
      </section>
    </div>
  );
}

export function UploadView() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>(null);

  async function uploadFile(file?: File) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setStatus({ tone: "error", message: "Choose a PDF file." });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setStatus({ tone: "error", message: "The PDF must be 20 MB or smaller." });
      return;
    }

    setIsUploading(true);
    setStatus({ tone: "info", message: "Sending PDF to AdaptIQ..." });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "The PDF could not be uploaded.");
      const message = payload.message ?? "File received.";
      setDocuments((current) => [{ name: payload.filename ?? file.name, message, uploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...current]);
      setStatus({ tone: "success", message });
      if (inputRef.current) inputRef.current.value = "";
    } catch (uploadError) {
      setStatus({ tone: "error", message: uploadError instanceof Error ? uploadError.message : "PDF upload failed." });
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(false);
    void uploadFile(event.dataTransfer.files[0]);
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <PageIntro eyebrow="My materials" title="Upload notes" description="Send a course PDF to your workspace." />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <section onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`rounded-3xl border-2 border-dashed p-8 text-center sm:p-14 ${isDragging ? "border-primary bg-indigo-100" : "border-indigo-200 bg-indigo-50/40"}`}>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => void uploadFile(event.target.files?.[0])} />
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-primary shadow-sm"><UploadCloud size={28} /></div>
          <h2 className="mt-6 font-display text-2xl font-bold text-ink">Drop your PDF here</h2><p className="mt-2 text-sm text-slate-500">or browse from your device · maximum 20 MB</p>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="mt-7 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{isUploading ? "Uploading..." : "Choose a file"}</button>
          {status && <p role={status.tone === "error" ? "alert" : "status"} className={`mt-5 text-sm ${status.tone === "success" ? "text-emerald-700" : status.tone === "error" ? "text-red-600" : "text-slate-600"}`}>{status.message}</p>}
          <p className="mt-4 text-xs text-amber-700">PDF extraction and question answering require the document-processing integration.</p>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-lg font-bold text-ink">Your documents</h2><FileText size={18} className="text-slate-300" /></div><div className="space-y-3">{documents.length ? documents.map((document) => <article key={`${document.name}-${document.uploadedAt}`} className="rounded-xl border border-slate-200 p-3"><p className="text-sm font-semibold text-ink">{document.name}</p><p className="mt-1 text-xs text-slate-500">{document.message} · {document.uploadedAt}</p></article>) : <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No documents uploaded in this session.</p>}</div></section>
      </div>
    </div>
  );
}

export function LectureView() {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<UploadStatus>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function uploadAudio(file: File) {
    setIsUploading(true);
    setStatus({ tone: "info", message: "Sending lecture audio..." });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/lecture/upload", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Lecture upload failed.");
      setStatus({ tone: "success", message: payload.message ?? `Lecture received: ${payload.filename}` });
      if (inputRef.current) inputRef.current.value = "";
    } catch (uploadError) {
      setStatus({ tone: "error", message: uploadError instanceof Error ? uploadError.message : "Lecture upload failed." });
    } finally {
      setIsUploading(false);
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus({ tone: "error", message: "Microphone recording is not supported by this browser." });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        void uploadAudio(new File([blob], "lecture-recording.webm", { type: blob.type || "audio/webm" }));
      };
      recorder.start();
      setIsRecording(true);
      setStatus({ tone: "info", message: "Recording. Stop when your lecture segment is complete." });
    } catch {
      setStatus({ tone: "error", message: "Microphone access was denied. Allow access and try again." });
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setIsRecording(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <PageIntro eyebrow="Lectures" title="Lecture mode" description="Record or upload audio to the lecture endpoint." />
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-3xl bg-ink p-7 text-white shadow-soft sm:p-9"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300"><AudioLines size={15} /> Lecture studio</div><h2 className="mt-4 font-display text-3xl font-bold">Capture a lecture segment.</h2><p className="mt-3 max-w-md text-sm leading-6 text-slate-300">Audio can be received now; transcription and note generation need an external processing integration.</p><div className="mt-9 flex flex-wrap gap-3"><button type="button" onClick={isRecording ? stopRecording : startRecording} disabled={isUploading} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-60"><Mic2 size={16} /> {isRecording ? "Stop and upload" : "Record lecture"}</button><input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAudio(file); }} /><button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading || isRecording} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-bold text-slate-200 hover:bg-white/15 disabled:opacity-60"><Headphones size={16} /> Upload recording</button></div>{status && <p role={status.tone === "error" ? "alert" : "status"} className={`mt-6 text-sm ${status.tone === "success" ? "text-emerald-300" : status.tone === "error" ? "text-red-300" : "text-slate-300"}`}>{status.message}</p>}</section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="font-display text-xl font-bold text-ink">Processing availability</h2><div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">The backend currently accepts and stores lecture metadata, but transcription, summarization, and personalized notes are not configured.</div><div className="mt-5 space-y-3 text-sm text-slate-500"><p className="flex items-center gap-2"><Check size={16} className="text-emerald-600" /> Audio upload and recording capture</p><p>Transcription integration required</p><p>Summary and study-note generation integration required</p></div></section>
      </div>
    </div>
  );
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className="mb-8"><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {eyebrow}</div><h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">{title}</h1><p className="mt-3 text-sm text-slate-500">{description}</p></section>;
}

function TopicCard({ title, topics, tone }: { title: string; topics: string[]; tone: "emerald" | "amber" | "violet" }) {
  const styles = { emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700" };
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-display text-lg font-bold text-ink">{title}</h3><div className="mt-4 flex flex-wrap gap-2">{topics.length ? topics.map((topic) => <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${styles[tone]}`} key={topic}>{topic}</span>) : <span className="text-sm text-slate-400">No data recorded yet</span>}</div></section>;
}