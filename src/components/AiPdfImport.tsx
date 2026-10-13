import { CheckSquare, FileUp, Loader2, Plus, Sparkles, Square, Trash2 } from "lucide-react";
import { useState, type DragEvent } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { BOARDS, CLASSES, DIFFS, QTYPES, chaptersFor, subjectsFor, topicsFor, type BankQuestion, type Board, type Cls } from "@/data/question-bank";
import { extractQuestions } from "@/lib/ai.functions";
import { celebrate } from "@/lib/celebrate";
import { texHtml } from "./QuestionBank";

const input = "w-full rounded-xl border border-input bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary";
const L = "ABCDE";
type Draft = BankQuestion & { selected: boolean };

async function pdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, 40); i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    pages.push(c.items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : "")).join(""));
  }
  return pages.join("\n\n");
}

function taxonomyText(board: Board) {
  return CLASSES.map((c) => `${c}: ` + subjectsFor(board, c).map((s) => `${s} [${chaptersFor(board, c, s).join("; ")}]`).join(" | ")).join("\n");
}

export function AiPdfImport({ onApprove }: { onApprove: (qs: BankQuestion[]) => void }) {
  const extract = useServerFn(extractQuestions);
  const [board, setBoard] = useState<Board>("Maharashtra State Board");
  const [hint, setHint] = useState<Cls>("11th");
  const [raw, setRaw] = useState("");
  const [fileName, setFileName] = useState("");
  const [stage, setStage] = useState<"idle" | "reading" | "ai">("idle");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [drag, setDrag] = useState(false);

  async function onFile(f?: File | null) {
    if (!f) return;
    if (f.type !== "application/pdf") return void toast.error("Please choose a PDF file");
    setStage("reading"); setFileName(f.name);
    try {
      const t = await pdfText(f);
      if (t.replace(/\s/g, "").length < 40) toast.warning("This PDF has very little readable text (it may be a scan). Paste the text below instead.");
      setRaw(t);
      toast.success("PDF read. Check the text, then press Extract questions.");
    } catch (e) { console.error(e); toast.error("Could not read this PDF. Paste the text below instead."); }
    finally { setStage("idle"); }
  }

  async function run() {
    if (raw.trim().length < 20) return void toast.error("Upload a PDF or paste the paper text first");
    setStage("ai");
    try {
      const r = await extract({ data: { text: raw.slice(0, 80000), taxonomy: taxonomyText(board), hintClass: hint } });
      if (r.error) return void toast.error(r.error);
      const now = Date.now();
      const list: Draft[] = r.questions.map((q, i) => {
        const cls = ((CLASSES as readonly string[]).includes(q.cls) ? q.cls : hint) as Cls;
        const subs = subjectsFor(board, cls);
        const subject = subs.includes(q.subject) ? q.subject : (subs.find((s) => s.toLowerCase().startsWith(q.subject.toLowerCase().slice(0, 4))) ?? q.subject);
        const type = ((QTYPES as readonly string[]).includes(q.type) ? q.type : q.options.length ? "MCQ" : "Short Answer") as Draft["type"];
        return {
          id: crypto.randomUUID(), createdAt: now + i, board, cls, subject, chapter: q.chapter, topic: q.topic, category: "Board Exam", type,
          difficulty: ((DIFFS as readonly string[]).includes(q.difficulty) ? q.difficulty : "Medium") as Draft["difficulty"],
          marks: q.marks > 0 ? q.marks : 1, negative: Math.min(0, q.negative || 0), text: q.text,
          options: type === "MCQ" ? q.options : [], answer: Math.max(0, Math.min(q.answerIndex, q.options.length - 1)),
          numericAnswer: q.numericAnswer || undefined, solution: q.solution, selected: true,
        };
      });
      setDrafts(list);
      if (!list.length) toast.warning("No questions were found in this text");
      else toast.success(`${list.length} questions found — please review them before saving`);
    } catch (e) { console.error(e); toast.error("Extraction failed. Please try again."); }
    finally { setStage("idle"); }
  }

  const upd = (id: string, p: Partial<Draft>) => setDrafts((l) => l.map((d) => (d.id === id ? { ...d, ...p } : d)));
  const sel = drafts.filter((d) => d.selected);

  function approve() {
    const bad = sel.find((d) => !d.text.trim() || (d.type === "MCQ" && (d.options.length < 2 || d.options.some((o) => !o.trim()))));
    if (bad) return void toast.error(`Question ${drafts.indexOf(bad) + 1} has empty text or options`);
    onApprove(sel.map(({ selected: _s, ...q }) => q));
    celebrate();
    toast.success(`${sel.length} verified questions added to the Question Bank`);
    setDrafts((l) => l.filter((d) => !d.selected));
  }

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); void onFile(e.dataTransfer.files[0]); };

  return (
    <div className="space-y-5 pb-20">
      <div>
        <h3 className="font-display text-lg font-semibold">AI PDF Import</h3>
        <p className="text-xs text-muted-foreground">Upload a question paper, worksheet or DPP. The AI suggests questions — nothing is saved until you review and approve.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted-foreground">Board<select className={`${input} mt-1`} value={board} onChange={(e) => setBoard(e.target.value as Board)}>{BOARDS.map((b) => <option key={b}>{b}</option>)}</select></label>
        <label className="text-xs text-muted-foreground">Most likely class<select className={`${input} mt-1`} value={hint} onChange={(e) => setHint(e.target.value as Cls)}>{CLASSES.map((b) => <option key={b}>{b}</option>)}</select></label>
      </div>
      <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center ${drag ? "border-primary bg-primary/10" : "border-border bg-secondary/30"}`}>
        {stage === "reading" ? <Loader2 className="size-8 animate-spin text-primary" /> : <FileUp className="size-8 text-primary" />}
        <p className="text-sm font-semibold">{fileName || "Drag & drop a PDF question paper"}</p>
        <p className="text-xs text-muted-foreground">or click to choose · text PDFs work best</p>
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
      </label>
      <label className="block text-xs text-muted-foreground">Paper text (you can also paste it here)
        <textarea rows={6} className={`${input} mt-1 font-mono text-xs`} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Q1. ..." />
      </label>
      <button onClick={run} disabled={stage !== "idle"} className="neon-surface inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-60">
        {stage === "ai" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} {stage === "ai" ? "Reading questions…" : "Extract questions with AI"}
      </button>

      {drafts.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display font-semibold">Review & verify ({drafts.length})</h4>
            <button onClick={() => setDrafts((l) => l.map((d) => ({ ...d, selected: true })))} className="glass rounded-full px-3 py-1 text-xs">Select all</button>
            <button onClick={() => setDrafts((l) => l.map((d) => ({ ...d, selected: false })))} className="glass rounded-full px-3 py-1 text-xs">Deselect all</button>
          </div>
          {drafts.map((d, n) => {
            const subs = subjectsFor(d.board, d.cls); const chs = chaptersFor(d.board, d.cls, d.subject); const tps = topicsFor(d.board, d.cls, d.subject, d.chapter);
            return (
              <div key={d.id} className={`rounded-2xl border p-4 ${d.selected ? "border-primary/50 bg-secondary/40" : "border-border bg-secondary/10 opacity-60"}`}>
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => upd(d.id, { selected: !d.selected })} className="inline-flex items-center gap-2 text-sm font-semibold">
                    {d.selected ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4" />} Question {n + 1}
                  </button>
                  <button onClick={() => setDrafts((l) => l.filter((x) => x.id !== d.id))} className="glass rounded-full p-2" aria-label="Delete"><Trash2 className="size-3.5" /></button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  <select className={input} value={d.cls} onChange={(e) => upd(d.id, { cls: e.target.value as Cls })}>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select>
                  <select className={input} value={d.subject} onChange={(e) => upd(d.id, { subject: e.target.value })}>{[...new Set([d.subject, ...subs])].map((c) => <option key={c}>{c}</option>)}</select>
                  <select className={input} value={d.chapter} onChange={(e) => upd(d.id, { chapter: e.target.value })}>{[...new Set([d.chapter, ...chs])].map((c) => <option key={c}>{c}</option>)}</select>
                  <select className={input} value={d.topic} onChange={(e) => upd(d.id, { topic: e.target.value })}>{[...new Set([d.topic, ...tps])].map((c) => <option key={c}>{c}</option>)}</select>
                  <select className={input} value={d.type} onChange={(e) => upd(d.id, { type: e.target.value as Draft["type"], options: e.target.value === "MCQ" && d.options.length < 2 ? ["", "", "", ""] : d.options })}>{QTYPES.map((c) => <option key={c}>{c}</option>)}</select>
                  <select className={input} value={d.difficulty} onChange={(e) => upd(d.id, { difficulty: e.target.value as Draft["difficulty"] })}>{DIFFS.map((c) => <option key={c}>{c}</option>)}</select>
                </div>
                <div className="mt-2 grid gap-3 lg:grid-cols-2">
                  <textarea rows={3} className={`${input} font-mono`} value={d.text} onChange={(e) => upd(d.id, { text: e.target.value })} />
                  <div className="rounded-xl border border-border bg-background/40 p-3 text-sm"><span dangerouslySetInnerHTML={{ __html: texHtml(d.text || "—") }} /></div>
                </div>
                {d.type === "MCQ" && (
                  <div className="mt-2 space-y-1.5">
                    {d.options.map((o, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <button onClick={() => upd(d.id, { answer: i })} className={`size-7 shrink-0 rounded-full text-xs font-bold ${d.answer === i ? "neon-surface" : "glass"}`} aria-label={`Mark ${L[i]} correct`}>{L[i]}</button>
                        <input className={input} value={o} onChange={(e) => upd(d.id, { options: d.options.map((x, j) => (j === i ? e.target.value : x)) })} />
                        <span className="hidden min-w-24 text-xs sm:block" dangerouslySetInnerHTML={{ __html: texHtml(o) }} />
                        {d.options.length > 2 && <button onClick={() => upd(d.id, { options: d.options.filter((_, j) => j !== i), answer: d.answer >= i && d.answer > 0 ? d.answer - 1 : d.answer })} aria-label="Remove option"><Trash2 className="size-3.5 text-muted-foreground" /></button>}
                      </div>
                    ))}
                    {d.options.length < 5 && <button onClick={() => upd(d.id, { options: [...d.options, ""] })} className="glass inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs"><Plus className="size-3" /> Add missing option</button>}
                  </div>
                )}
                {d.type === "Numerical" && <input className={`${input} mt-2 max-w-xs`} placeholder="Numerical answer" value={d.numericAnswer ?? ""} onChange={(e) => upd(d.id, { numericAnswer: e.target.value })} />}
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_100px_100px]">
                  <input className={input} placeholder="Solution / hint" value={d.solution} onChange={(e) => upd(d.id, { solution: e.target.value })} />
                  <input type="number" step={0.5} className={input} value={d.marks} onChange={(e) => upd(d.id, { marks: Number(e.target.value) || 1 })} aria-label="Marks" />
                  <input type="number" step={0.25} max={0} className={input} value={d.negative} onChange={(e) => upd(d.id, { negative: Math.min(0, Number(e.target.value) || 0) })} aria-label="Negative marks" />
                </div>
              </div>
            );
          })}
          <div className="glass sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3">
            <span className="text-sm font-semibold">{sel.length} of {drafts.length} questions selected</span>
            <button onClick={approve} disabled={!sel.length} className="neon-surface rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50">Approve & add to Question Bank</button>
          </div>
        </div>
      )}
    </div>
  );
}
