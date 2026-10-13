import katex from "katex";
import "katex/dist/katex.min.css";
import { BookOpen, Database, Download, FileKey2, FilePlus2, Loader2, Pencil, Plus, Printer, Rocket, Search, Sparkles, Trash2, UploadCloud, Wand2, X } from "lucide-react";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { toast } from "sonner";
import {
  BOARDS, CLASSES, DIFFS, EXAM_CATS, QTYPES, chaptersFor, makeSeedBank, pickQuestions, subjectsFor, topicsFor,
  type BankQuestion, type Board, type Cls, type Diff, type ExamCat, type QType,
} from "@/data/question-bank";
import { academyInfo as A } from "@/lib/academy-info";
import { usePortal } from "@/lib/use-portal";
import { celebrate } from "@/lib/celebrate";
import { bankToCsv, csvTemplate, csvToBank, saveText } from "@/lib/qb-csv";
import { AiPdfImport } from "./AiPdfImport";

const KEY = "koyana-question-bank-v1";
const input = "w-full rounded-xl border border-input bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary";
const L = "ABCDE";

/** Render text with $inline$ / $$block$$ LaTeX to HTML (escaped otherwise). */
export function texHtml(s: string) {
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return s.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g).map((part) => {
    const block = part.startsWith("$$") && part.endsWith("$$") && part.length > 4;
    const inline = !block && part.startsWith("$") && part.endsWith("$") && part.length > 2;
    if (!block && !inline) return esc(part).replace(/\n/g, "<br>");
    try { return katex.renderToString(part.slice(block ? 2 : 1, block ? -2 : -1), { displayMode: block, throwOnError: false }); }
    catch { return esc(part); }
  }).join("");
}
function Tex({ s, className }: { s: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: texHtml(s) }} />;
}

type Tax = { board: Board; cls: Cls; subject: string; chapter: string; topic: string; category: ExamCat };
function useCascade(init?: Partial<Tax>) {
  const [t, setT] = useState<Tax>(() => {
    const board = init?.board ?? "Maharashtra State Board";
    const cls = init?.cls ?? "10th";
    const subject = init?.subject ?? subjectsFor(board, cls)[0]!;
    const chapter = init?.chapter ?? chaptersFor(board, cls, subject)[0] ?? "";
    return { board, cls, subject, chapter, topic: init?.topic ?? topicsFor(board, cls, subject, chapter)[0] ?? "", category: init?.category ?? "Board Exam" };
  });
  const set = (p: Partial<Tax>) => setT((o) => {
    const n = { ...o, ...p };
    if (p.board || p.cls) { const sub = subjectsFor(n.board, n.cls); if (!sub.includes(n.subject)) n.subject = sub[0]!; }
    if (p.board || p.cls || p.subject) { const ch = chaptersFor(n.board, n.cls, n.subject); if (!ch.includes(n.chapter)) n.chapter = ch[0] ?? ""; }
    if (p.board || p.cls || p.subject || p.chapter) { const tp = topicsFor(n.board, n.cls, n.subject, n.chapter); if (!tp.includes(n.topic)) n.topic = tp[0] ?? ""; }
    return n;
  });
  return [t, set] as const;
}

function CascadeSelects({ t, set, withAll, hide = [] }: { t: Tax | FilterTax; set: (p: any) => void; withAll?: boolean; hide?: string[] }) {
  const ALL = withAll ? [<option key="__all" value="">All</option>] : [];
  const b = (t.board || "Maharashtra State Board") as Board;
  const c = (t.cls || "10th") as Cls;
  const fields: [string, string, string[]][] = [
    ["board", "Board", [...BOARDS]],
    ["cls", "Class", [...CLASSES]],
    ["subject", "Subject", withAll && !t.cls ? [...new Set(CLASSES.flatMap((x) => subjectsFor(b, x)))] : subjectsFor(b, c)],
    ["chapter", "Chapter", t.subject ? chaptersFor(b, c, t.subject) : []],
    ["topic", "Topic", t.subject && t.chapter ? topicsFor(b, c, t.subject, t.chapter) : []],
    ["category", "Exam category", [...EXAM_CATS]],
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {fields.filter(([k]) => !hide.includes(k)).map(([k, label, opts]) => (
        <label key={k} className="text-xs text-muted-foreground">
          {label}
          <select className={`${input} mt-1`} value={(t as any)[k]} onChange={(e) => set({ [k]: e.target.value })} disabled={!withAll && opts.length === 0}>
            {ALL}
            {opts.map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

type FilterTax = { board: string; cls: string; subject: string; chapter: string; topic: string; category: string };

function uploadToCloudinary(file: File): Promise<{ url: string; demo: boolean }> {
  const cloud = import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"] as string | undefined;
  const preset = import.meta.env["VITE_CLOUDINARY_UPLOAD_PRESET"] as string | undefined;
  if (!cloud || !preset) return new Promise((r) => setTimeout(() => r({ url: URL.createObjectURL(file), demo: true }), 700));
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", preset);
  fd.append("folder", "koyana-question-bank");
  return fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, { method: "POST", body: fd })
    .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j?.error?.message ?? "Upload failed"); return { url: j.secure_url as string, demo: false }; });
}

// ───────────────────────── Studio ─────────────────────────
function Studio({ editing, onSave, onCancel }: { editing: BankQuestion | null; onSave: (q: BankQuestion) => void; onCancel: () => void }) {
  const [mode, setMode] = useState<"manual" | "upload">("manual");
  const [t, set] = useCascade(editing ?? undefined);
  const [type, setType] = useState<QType>(editing?.type ?? "MCQ");
  const [difficulty, setDiff] = useState<Diff>(editing?.difficulty ?? "Medium");
  const [marks, setMarks] = useState(editing?.marks ?? 1);
  const [negative, setNeg] = useState(editing?.negative ?? 0);
  const [text, setText] = useState(editing?.text ?? "");
  const [options, setOptions] = useState<string[]>(editing?.options.length ? editing.options : ["", "", "", ""]);
  const [answer, setAnswer] = useState(editing?.answer ?? 0);
  const [numericAnswer, setNum] = useState(editing?.numericAnswer ?? "");
  const [solution, setSolution] = useState(editing?.solution ?? "");
  const [asset, setAsset] = useState<{ url: string; name: string } | null>(editing?.assetUrl ? { url: editing.assetUrl, name: editing.assetName ?? "attachment" } : null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  async function handleFiles(files: FileList | null): Promise<void> {
    const f = files?.[0];
    if (!f) return;
    if (!/pdf|image/.test(f.type)) return void toast.error("Only PDFs and images are supported");
    if (f.size > 20 * 1024 * 1024) return void toast.error("File too large (max 20 MB)");
    setUploading(true);
    try {
      const r = await uploadToCloudinary(f);
      setAsset({ url: r.url, name: f.name });
      toast.success(r.demo ? "Attached locally (Cloudinary not configured yet)" : "Uploaded to Cloudinary");
      if (!text) setText(`Refer to the attached ${f.type.includes("pdf") ? "document" : "diagram"}: ${f.name}`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  }

  function save(): void {
    if (!text.trim()) return void toast.error("Write the question text");
    if (!t.chapter) return void toast.error("Choose a chapter");
    if (type === "MCQ") {
      if (options.length < 2 || options.some((o) => !o.trim())) return void toast.error("Fill every option (at least 2)");
    }
    if (type === "Numerical" && !numericAnswer.trim()) return void toast.error("Give the numerical answer");
    onSave({
      id: editing?.id ?? crypto.randomUUID(), createdAt: editing?.createdAt ?? Date.now(),
      ...t, type, difficulty, marks, negative, text,
      options: type === "MCQ" ? options : [], answer: type === "MCQ" ? Math.min(answer, options.length - 1) : 0,
      numericAnswer: type === "Numerical" ? numericAnswer : undefined, solution,
      assetUrl: asset?.url, assetName: asset?.name,
    });
    if (!editing) { setText(""); setOptions(["", "", "", ""]); setAnswer(0); setNum(""); setSolution(""); setAsset(null); }
  }

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">{editing ? "Edit question" : "Add a question"}</h3>
        <div className="flex gap-2">
          {(["manual", "upload"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${mode === m ? "neon-surface" : "glass text-muted-foreground"}`}>
              {m === "manual" ? "Mode A · Type it in" : "Mode B · Upload file"}
            </button>
          ))}
          {editing && <button onClick={onCancel} className="glass rounded-full px-3 py-1.5 text-xs"><X className="inline size-3" /> Cancel</button>}
        </div>
      </div>

      <CascadeSelects t={t} set={set} />

      {mode === "upload" && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center ${drag ? "border-primary bg-primary/10" : "border-border bg-secondary/30"}`}
        >
          {uploading ? <Loader2 className="size-8 animate-spin text-primary" /> : <UploadCloud className="size-8 text-primary" />}
          <p className="text-sm font-semibold">{uploading ? "Uploading…" : "Drag & drop a PDF, paper scan or diagram"}</p>
          <p className="text-xs text-muted-foreground">or click to choose · max 20 MB</p>
          <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </label>
      )}
      {asset && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/40 px-3 py-2 text-xs">
          <a href={asset.url} target="_blank" rel="noreferrer" className="truncate text-primary underline">{asset.name}</a>
          <button onClick={() => setAsset(null)} aria-label="Remove attachment"><X className="size-4" /></button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="text-xs text-muted-foreground">Question type
          <select className={`${input} mt-1`} value={type} onChange={(e) => setType(e.target.value as QType)}>{QTYPES.map((q) => <option key={q}>{q}</option>)}</select>
        </label>
        <label className="text-xs text-muted-foreground">Difficulty
          <select className={`${input} mt-1`} value={difficulty} onChange={(e) => setDiff(e.target.value as Diff)}>{DIFFS.map((q) => <option key={q}>{q}</option>)}</select>
        </label>
        <label className="text-xs text-muted-foreground">Marks
          <input type="number" min={0.5} step={0.5} className={`${input} mt-1`} value={marks} onChange={(e) => setMarks(Number(e.target.value) || 1)} />
        </label>
        <label className="text-xs text-muted-foreground">Negative marks
          <input type="number" max={0} step={0.25} className={`${input} mt-1`} value={negative} onChange={(e) => setNeg(Math.min(0, Number(e.target.value) || 0))} />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-xs text-muted-foreground">Question (use $…$ for equations, e.g. $x^2+\frac{"{"}1{"}"}{"{"}2{"}"}$)
          <textarea rows={4} className={`${input} mt-1 font-mono`} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <div className="rounded-xl border border-border bg-background/40 p-3 text-sm">
          <p className="mb-1 text-xs text-muted-foreground">Live preview</p>
          <Tex s={text || "—"} />
        </div>
      </div>

      {type === "MCQ" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Options — tick the correct answer</p>
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => setAnswer(i)} className={`size-8 shrink-0 rounded-full text-xs font-bold ${answer === i ? "neon-surface" : "glass"}`} aria-label={`Mark option ${L[i]} correct`}>{L[i]}</button>
              <input className={input} value={o} placeholder={`Option ${L[i]}`} onChange={(e) => setOptions((l) => l.map((x, j) => (j === i ? e.target.value : x)))} />
              {options.length > 2 && <button onClick={() => { setOptions((l) => l.filter((_, j) => j !== i)); if (answer >= i && answer > 0) setAnswer(answer - 1); }} aria-label="Remove option"><Trash2 className="size-4 text-muted-foreground" /></button>}
            </div>
          ))}
          {options.length < 5 && <button onClick={() => setOptions((l) => [...l, ""])} className="glass rounded-full px-3 py-1 text-xs">+ Add option</button>}
        </div>
      )}
      {type === "Numerical" && (
        <label className="block text-xs text-muted-foreground">Correct numerical answer
          <input className={`${input} mt-1 max-w-xs`} value={numericAnswer} onChange={(e) => setNum(e.target.value)} placeholder="e.g. 4 or 2.5" />
        </label>
      )}

      <label className="block text-xs text-muted-foreground">Detailed solution / explanation
        <textarea rows={3} className={`${input} mt-1 font-mono`} value={solution} onChange={(e) => setSolution(e.target.value)} />
      </label>

      <button onClick={save} className="neon-surface inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold">
        <FilePlus2 className="size-4" /> {editing ? "Save changes" : "Add to question bank"}
      </button>
    </div>
  );
}

// ───────────────────────── Explorer ─────────────────────────
const emptyF: FilterTax = { board: "", cls: "", subject: "", chapter: "", topic: "", category: "" };
function Explorer({ bank, onEdit, onDelete, onImport }: { bank: BankQuestion[]; onEdit: (q: BankQuestion) => void; onDelete: (id: string) => void; onImport: (qs: BankQuestion[]) => void }) {
  const [f, setF] = useState<FilterTax>(emptyF);
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState("");
  const [type, setType] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const setFilter = (p: Partial<FilterTax>) => setF((o) => {
    const n = { ...o, ...p };
    if ("board" in p || "cls" in p) { n.subject = ""; n.chapter = ""; n.topic = ""; }
    if ("subject" in p) { n.chapter = ""; n.topic = ""; }
    if ("chapter" in p) n.topic = "";
    return n;
  });
  const rows = useMemo(() => bank.filter((x) =>
    (!f.board || x.board === f.board) && (!f.cls || x.cls === f.cls) && (!f.subject || x.subject === f.subject) &&
    (!f.chapter || x.chapter === f.chapter) && (!f.topic || x.topic === f.topic) && (!f.category || x.category === f.category) &&
    (!diff || x.difficulty === diff) && (!type || x.type === type) &&
    (!q || `${x.text} ${x.chapter} ${x.topic}`.toLowerCase().includes(q.toLowerCase())),
  ).sort((a, b) => b.createdAt - a.createdAt), [bank, f, q, diff, type]);

  function importCsv(f?: File | null) {
    if (!f) return;
    f.text().then((txt) => {
      const { rows: got, errors } = csvToBank(txt);
      if (got.length) { onImport(got); toast.success(`${got.length} questions imported`); }
      if (errors.length) toast.error(`${errors.length} rows skipped`, { description: errors.slice(0, 5).join("\n") + (errors.length > 5 ? "\n…" : "") });
      if (!got.length && !errors.length) toast.error("The file has no question rows");
    });
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button onClick={() => saveText("koyana-question-template.csv", csvTemplate())} className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"><Download className="size-3.5" /> CSV template</button>
        <label className="glass inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); importCsv(e.dataTransfer.files[0]); }}>
          <UploadCloud className="size-3.5" /> Import CSV (click or drop)
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { importCsv(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        <button onClick={() => saveText(`koyana-question-bank-${rows.length}.csv`, bankToCsv(rows))} className="neon-surface inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"><Download className="size-3.5" /> Export {rows.length} to CSV</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[["Total questions", bank.length], ["Showing", rows.length], ["MCQs", bank.filter((x) => x.type === "MCQ").length], ["Subjects", new Set(bank.map((x) => x.subject)).size]].map(([k, v]) => (
          <div key={k as string} className="rounded-2xl bg-secondary/40 p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="font-display text-2xl font-bold">{v}</p></div>
        ))}
      </div>
      <CascadeSelects t={f} set={setFilter} withAll hide={f.cls ? [] : ["chapter", "topic"]} />
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><input className={`${input} pl-9`} placeholder="Search question text…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className={`${input} w-auto`} value={diff} onChange={(e) => setDiff(e.target.value)}><option value="">Any difficulty</option>{DIFFS.map((d) => <option key={d}>{d}</option>)}</select>
        <select className={`${input} w-auto`} value={type} onChange={(e) => setType(e.target.value)}><option value="">Any type</option>{QTYPES.map((d) => <option key={d}>{d}</option>)}</select>
        <button onClick={() => { setF(emptyF); setQ(""); setDiff(""); setType(""); }} className="glass rounded-full px-3 text-xs">Clear</button>
      </div>
      <div className="space-y-2">
        {rows.length === 0 && <p className="rounded-2xl bg-secondary/30 p-6 text-center text-sm text-muted-foreground">No questions match these filters.</p>}
        {rows.slice(0, 200).map((x) => (
          <div key={x.id} className="rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <button onClick={() => setOpen(open === x.id ? null : x.id)} className="min-w-0 flex-1 text-left text-sm"><Tex s={x.text} /></button>
              <div className="flex gap-1">
                <button onClick={() => onEdit(x)} className="glass rounded-full p-2" aria-label="Edit"><Pencil className="size-3.5" /></button>
                <button onClick={() => { if (confirm("Delete this question?")) onDelete(x.id); }} className="glass rounded-full p-2" aria-label="Delete"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              {[x.board === "Maharashtra State Board" ? "MSB" : x.board, x.cls, x.subject, x.chapter, x.topic, x.category, x.type, x.difficulty, `+${x.marks}${x.negative ? ` / ${x.negative}` : ""}`].map((b, i) => (
                <span key={i} className={`rounded-full px-2 py-0.5 ${i === 7 ? (x.difficulty === "Hard" ? "bg-destructive/20 text-destructive" : x.difficulty === "Easy" ? "bg-primary/15 text-primary" : "bg-accent/30") : "bg-secondary"}`}>{b}</span>
              ))}
              {x.assetUrl && <a href={x.assetUrl} target="_blank" rel="noreferrer" className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">📎 attachment</a>}
            </div>
            {open === x.id && (
              <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                {x.type === "MCQ" && x.options.map((o, i) => <p key={i} className={i === x.answer ? "font-semibold text-primary" : ""}>{L[i]}. <Tex s={o} /> {i === x.answer && "✓"}</p>)}
                {x.numericAnswer && <p className="font-semibold text-primary">Answer: {x.numericAnswer}</p>}
                {x.solution && <p className="text-muted-foreground"><b>Solution:</b> <Tex s={x.solution} /></p>}
              </div>
            )}
          </div>
        ))}
        {rows.length > 200 && <p className="text-center text-xs text-muted-foreground">Showing first 200 of {rows.length}. Narrow the filters to see more.</p>}
      </div>
    </div>
  );
}

// ───────────────────────── Paper Builder ─────────────────────────
type PaperSection = { subject: string; qs: BankQuestion[] };
const isImg = (q: BankQuestion) => !!q.assetUrl && (/\.(png|jpe?g|webp|svg|gif)(\?|#|$)/i.test(q.assetUrl) || /\.(png|jpe?g|webp|svg|gif)$/i.test(q.assetName ?? "") || q.assetUrl.startsWith("data:image"));
function paperHtml(title: string, meta: string, sections: PaperSection[], key: boolean) {
  const all = sections.flatMap((s) => s.qs);
  const total = all.reduce((s, q) => s + q.marks, 0);
  let n = 0;
  const qHtml = (q: BankQuestion) => { n++; return `<div class="q"><span class="m">${q.marks}${q.negative ? ` / ${q.negative}` : ""}</span><b>Q${n}.</b> ${texHtml(q.text)}
${q.assetUrl ? (isImg(q) ? `<figure><img src="${q.assetUrl}" alt="Figure for Q${n}"></figure>` : `<div><a href="${q.assetUrl}">[Attached document]</a></div>`) : ""}
${q.type === "MCQ" ? `<ol type="A">${q.options.map((o, j) => `<li${key && j === q.answer ? ' class="ok"' : ""}>${texHtml(o)}</li>`).join("")}</ol>` : key ? "" : `<div class="lines" style="height:${q.type === "Long Answer" ? 120 : q.type === "Short Answer" ? 60 : 30}px"></div>`}
${key ? `<p class="ans"><b>Answer:</b> ${q.type === "MCQ" ? L[q.answer] : q.numericAnswer ? texHtml(q.numericAnswer) : "See solution"}${q.solution ? `<br><b>Solution:</b> ${texHtml(q.solution)}` : ""}</p>` : ""}</div>`; };
  const multi = sections.length > 1;
  const body = sections.map((s, i) => `${multi ? `<h3 class="sec">Section ${i + 1}: ${s.subject} <small>(${s.qs.length} questions · ${s.qs.reduce((a, q) => a + q.marks, 0)} marks)</small></h3>` : ""}${s.qs.map(qHtml).join("")}`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<style>body{font-family:Georgia,serif;max-width:800px;margin:24px auto;padding:0 16px;color:#111}header{text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:12px}
h1{margin:0;font-size:22px}.q{margin:14px 0;page-break-inside:avoid}.m{float:right;font-size:12px;border:1px solid #111;padding:1px 6px}.ok{font-weight:bold;color:#0a6}
.sec{border-bottom:1px solid #111;padding-bottom:4px;margin-top:24px}figure{margin:8px 0}figure img{max-width:100%;max-height:320px;border:1px solid #ccc;border-radius:4px}
.ans{background:#f3f3f3;padding:6px 8px;font-size:14px}.lines{border-bottom:1px dashed #999}@media print{button{display:none}}</style></head><body>
<button onclick="print()">Print / Save as PDF</button><header><h1>${A.name}</h1><small>${A.college} · ${A.address}</small>
<h2 style="margin:8px 0 0;font-size:18px">${title}${key ? " — Answer Key" : ""}</h2><small>${meta} · Questions: ${all.length} · Maximum marks: ${total}</small></header>
${key ? "" : "<p><b>Instructions:</b> Attempt all questions. Marks (and negative marks, if any) are shown beside each question.</p>"}${body}</body></html>`;
}
function openHtml(html: string) {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const w = window.open(url, "_blank");
  if (!w) { const a = document.createElement("a"); a.href = url; a.download = "paper.html"; a.click(); }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

type Section = { id: string; subject: string; chapters: string[]; type: QType | "Any"; count: number; diff: Diff | "Mixed" };
const TRACKS = { "JEE": "JEE Main", "NEET": "NEET", "MHT-CET": "MHT-CET", "Foundation": "Custom" } as const;

function PublishModal({ title, duration, sections, cls, onClose }: { title: string; duration: number; sections: PaperSection[]; cls: string; onClose: () => void }) {
  const { addExam } = usePortal();
  const [name, setName] = useState(title);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [dur, setDur] = useState(duration);
  const [deadline, setDeadline] = useState("");
  const [track, setTrack] = useState<keyof typeof TRACKS>("JEE");
  const mcqs = sections.flatMap((s) => s.qs.filter((q) => q.type === "MCQ" && q.options.length >= 2).map((q) => ({ q, subject: s.subject })));
  const skipped = sections.reduce((a, s) => a + s.qs.length, 0) - mcqs.length;
  function publish() {
    if (!name.trim() || !date || !deadline) return void toast.error("Fill exam name, exam date and registration deadline");
    if (!mcqs.length) return void toast.error("Online exams need MCQ questions — this paper has none");
    const fmt = (d: string) => new Date(d + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const [hh, mm] = time.split(":").map(Number);
    const t12 = `${((hh! + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${hh! >= 12 ? "PM" : "AM"}`;
    const id = `qb-${Date.now().toString(36)}`;
    addExam({
      id, name: name.trim(), pattern: TRACKS[track], durationMin: dur,
      description: `Class ${cls} · ${track} · ${sections.map((s) => `${s.subject} (${s.qs.length})`).join(", ")} · from Question Bank`,
      marking: { correct: 4, wrong: -1 }, regCloses: fmt(deadline), regDeadline: new Date(deadline + "T23:59").toISOString(),
      slots: [{ id: "s1", date: fmt(date), time: t12, capacity: 120, booked: 0 }],
      questions: mcqs.map(({ q, subject }, i) => ({
        id: `${id}-${i + 1}`, subject, text: q.text, options: q.options, answer: q.answer,
        marks: { correct: q.marks, wrong: q.negative }, difficulty: q.difficulty === "Medium" ? "Moderate" : q.difficulty,
      })),
    });
    celebrate();
    toast.success("Published! Students can now book a slot on the Mock Exam page.");
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur" onClick={onClose}>
      <div className="glass w-full max-w-lg space-y-3 rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Publish as online exam</h3><button onClick={onClose} aria-label="Close"><X className="size-4" /></button></div>
        <label className="block text-xs text-muted-foreground">Exam name<input className={`${input} mt-1`} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted-foreground">Exam date<input type="date" className={`${input} mt-1`} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="text-xs text-muted-foreground">Start time<input type="time" className={`${input} mt-1`} value={time} onChange={(e) => setTime(e.target.value)} /></label>
          <label className="text-xs text-muted-foreground">Duration (min)<input type="number" min={5} className={`${input} mt-1`} value={dur} onChange={(e) => setDur(Number(e.target.value) || 60)} /></label>
          <label className="text-xs text-muted-foreground">Registration closes<input type="date" className={`${input} mt-1`} value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
          <label className="col-span-2 text-xs text-muted-foreground">Target track<select className={`${input} mt-1`} value={track} onChange={(e) => setTrack(e.target.value as keyof typeof TRACKS)}>{Object.keys(TRACKS).map((k) => <option key={k}>{k}</option>)}</select></label>
        </div>
        <p className="text-xs text-muted-foreground">Class {cls} · {mcqs.length} MCQs go online with their own marks.{skipped > 0 && ` ${skipped} non-MCQ questions stay in the printed paper only.`}</p>
        <button onClick={publish} className="neon-surface w-full rounded-full px-5 py-2.5 text-sm font-semibold">Publish to Mock Exams</button>
      </div>
    </div>
  );
}

function Builder({ bank }: { bank: BankQuestion[] }) {
  const [t, set] = useCascade();
  const subs = subjectsFor(t.board, t.cls);
  const mk = (subject: string): Section => ({ id: crypto.randomUUID(), subject, chapters: [], type: "MCQ", count: 10, diff: "Mixed" });
  const [sections, setSections] = useState<Section[]>(() => [{ id: "s0", subject: subs[0]!, chapters: [], type: "MCQ", count: 10, diff: "Mixed" }]);
  const [title, setTitle] = useState("Unit Test");
  const [duration, setDuration] = useState(60);
  const [paper, setPaper] = useState<PaperSection[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  useEffect(() => {
    const s = subjectsFor(t.board, t.cls);
    setSections((l) => l.map((x) => (s.includes(x.subject) ? x : { ...x, subject: s[0]!, chapters: [] })));
  }, [t.board, t.cls]);
  const upd = (id: string, p: Partial<Section>) => setSections((l) => l.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const poolFor = (s: Section) => bank.filter((q) => q.board === t.board && q.cls === t.cls && q.subject === s.subject &&
    (s.chapters.length === 0 || s.chapters.includes(q.chapter)) && (s.type === "Any" || q.type === s.type));

  function generate() {
    setBusy(true);
    setTimeout(() => {
      const seed = Date.now() % 100000;
      const out = sections.map((s, i) => ({ subject: s.subject, qs: pickQuestions(poolFor(s), s.count, s.diff, seed + i), want: s.count }));
      setPaper(out.filter((s) => s.qs.length).map(({ subject, qs }) => ({ subject, qs })));
      setBusy(false);
      const got = out.reduce((a, s) => a + s.qs.length, 0), want = out.reduce((a, s) => a + s.want, 0);
      if (got === 0) toast.error("No questions match. Add some in the studio or widen the criteria.");
      else if (got < want) toast.warning(`Only ${got} of ${want} questions found (${out.filter((s) => s.qs.length < s.want).map((s) => s.subject).join(", ")} short)`);
      else toast.success(`Paper ready with ${got} questions`);
    }, 400);
  }
  const meta = `${t.board} · Class ${t.cls} · ${[...new Set(sections.map((s) => s.subject))].join(" + ")} · Duration: ${duration} min`;
  const flat = paper?.flatMap((s) => s.qs) ?? [];

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold">Question paper builder</h3>
      <CascadeSelects t={t} set={set} hide={["subject", "chapter", "topic", "category"]} />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-muted-foreground sm:col-span-2">Paper title<input className={`${input} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="text-xs text-muted-foreground">Duration (min)<input type="number" min={5} className={`${input} mt-1`} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 60)} /></label>
      </div>
      {sections.map((s, i) => {
        const allCh = chaptersFor(t.board, t.cls, s.subject);
        return (
          <div key={s.id} className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold">Section {i + 1}</p>
              {sections.length > 1 && <button onClick={() => setSections((l) => l.filter((x) => x.id !== s.id))} className="glass rounded-full p-1.5" aria-label="Remove section"><Trash2 className="size-3.5" /></button>}
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <label className="text-xs text-muted-foreground">Subject<select className={`${input} mt-1`} value={s.subject} onChange={(e) => upd(s.id, { subject: e.target.value, chapters: [] })}>{subs.map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="text-xs text-muted-foreground">Type<select className={`${input} mt-1`} value={s.type} onChange={(e) => upd(s.id, { type: e.target.value as QType })}><option>Any</option>{QTYPES.map((q) => <option key={q}>{q}</option>)}</select></label>
              <label className="text-xs text-muted-foreground">How many<input type="number" min={1} max={200} className={`${input} mt-1`} value={s.count} onChange={(e) => upd(s.id, { count: Math.max(1, Number(e.target.value) || 1) })} /></label>
              <label className="text-xs text-muted-foreground">Difficulty<select className={`${input} mt-1`} value={s.diff} onChange={(e) => upd(s.id, { diff: e.target.value as Diff })}><option>Mixed</option>{DIFFS.map((q) => <option key={q}>{q}</option>)}</select></label>
            </div>
            <div className="flex flex-wrap gap-2">
              {allCh.map((c) => {
                const on = s.chapters.includes(c);
                return <button key={c} onClick={() => upd(s.id, { chapters: on ? s.chapters.filter((x) => x !== c) : [...s.chapters, c] })} className={`rounded-full px-3 py-1 text-xs ${on ? "neon-surface" : "glass text-muted-foreground"}`}>{c}</button>;
              })}
            </div>
            <p className="text-xs text-muted-foreground">{poolFor(s).length} matching questions · no chapter selected = all chapters</p>
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setSections((l) => [...l, mk(subs.find((x) => !l.some((y) => y.subject === x)) ?? subs[0]!)])} className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm"><Plus className="size-4" /> Add subject section</button>
        <button onClick={generate} disabled={busy} className="neon-surface inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />} Generate paper
        </button>
      </div>

      {paper && flat.length > 0 && (
        <div className="rounded-2xl border border-border bg-background/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-display font-semibold">{title}</p><p className="text-xs text-muted-foreground">{meta} · {flat.length} questions · {flat.reduce((s, q) => s + q.marks, 0)} marks</p></div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openHtml(paperHtml(title, meta, paper, false))} className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"><Printer className="size-3.5" /> Print paper</button>
              <button onClick={() => openHtml(paperHtml(title, meta, paper, true))} className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"><FileKey2 className="size-3.5" /> Answer key</button>
              <button onClick={() => setPublishing(true)} className="neon-surface inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"><Rocket className="size-3.5" /> Publish as online exam</button>
            </div>
          </div>
          {(() => { let n = 0; return paper.map((sec, si) => (
            <div key={si} className="mt-4">
              {paper.length > 1 && <p className="border-b border-border pb-1 text-sm font-semibold text-primary">Section {si + 1}: {sec.subject} · {sec.qs.length} Qs · {sec.qs.reduce((a, q) => a + q.marks, 0)} marks</p>}
              <ol className="mt-2 space-y-3 text-sm">
                {sec.qs.map((q) => { n++; return (
                  <li key={q.id} className="border-t border-border pt-3 first:border-0">
                    <div className="flex justify-between gap-2"><span><b>Q{n}.</b> <Tex s={q.text} /></span><span className="shrink-0 text-xs text-muted-foreground">[{q.marks}] · {q.difficulty}</span></div>
                    {isImg(q) && <img src={q.assetUrl} alt={`Figure for question ${n}`} className="mt-2 max-h-48 rounded-lg border border-border" />}
                    {q.type === "MCQ" && <div className="mt-1 grid gap-1 pl-6 sm:grid-cols-2">{q.options.map((o, j) => <span key={j}>{L[j]}. <Tex s={o} /></span>)}</div>}
                  </li>
                ); })}
              </ol>
            </div>
          )); })()}
        </div>
      )}
      {publishing && paper && <PublishModal title={title} duration={duration} sections={paper} cls={t.cls} onClose={() => setPublishing(false)} />}
    </div>
  );
}

// ───────────────────────── Shell ─────────────────────────
type View = "explorer" | "studio" | "ai" | "builder";
export function QuestionBank() {
  const [bank, setBank] = useState<BankQuestion[]>(() => makeSeedBank());
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("explorer");
  const [editing, setEditing] = useState<BankQuestion | null>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setBank(JSON.parse(raw)); } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(bank)); }, [bank, loaded]);
  const addMany = (qs: BankQuestion[]) => setBank((b) => [...qs, ...b]);

  const nav: [View, string, typeof Database][] = [["explorer", "Question Bank", Database], ["studio", "Add Question", FilePlus2], ["ai", "AI PDF Import", Sparkles], ["builder", "Paper Builder", BookOpen]];
  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <aside className="flex gap-2 overflow-x-auto lg:flex-col">
        {nav.map(([id, label, Icon]) => (
          <button key={id} onClick={() => { setView(id); if (id !== "studio") setEditing(null); }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold ${view === id ? "neon-surface" : "glass text-muted-foreground"}`}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
        <p className="hidden px-1 pt-2 text-[11px] text-muted-foreground lg:block">{bank.length} questions saved on this device.</p>
      </aside>
      <section className="min-w-0">
        {view === "explorer" && <Explorer bank={bank} onImport={addMany} onEdit={(q) => { setEditing(q); setView("studio"); }} onDelete={(id) => { setBank((b) => b.filter((x) => x.id !== id)); toast.success("Question deleted"); }} />}
        {view === "studio" && (
          <Studio key={editing?.id ?? "new"} editing={editing} onCancel={() => { setEditing(null); setView("explorer"); }}
            onSave={(q) => {
              setBank((b) => (b.some((x) => x.id === q.id) ? b.map((x) => (x.id === q.id ? q : x)) : [q, ...b]));
              toast.success(editing ? "Question updated" : "Question added to the bank");
              if (editing) { setEditing(null); setView("explorer"); }
            }} />
        )}
        {view === "ai" && <AiPdfImport onApprove={addMany} />}
        {view === "builder" && <Builder bank={bank} />}
      </section>
    </div>
  );
}
