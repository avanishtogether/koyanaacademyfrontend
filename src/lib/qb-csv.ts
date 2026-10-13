import { BOARDS, CLASSES, DIFFS, EXAM_CATS, QTYPES, type BankQuestion } from "@/data/question-bank";

export const CSV_COLS = ["board", "cls", "subject", "chapter", "topic", "category", "type", "difficulty", "marks", "negative", "text", "optionA", "optionB", "optionC", "optionD", "optionE", "answer", "numericAnswer", "solution", "assetUrl"] as const;
const L = "ABCDE";
const cell = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export function bankToCsv(rows: BankQuestion[]) {
  const lines = rows.map((q) => [q.board, q.cls, q.subject, q.chapter, q.topic, q.category, q.type, q.difficulty, q.marks, q.negative, q.text,
    ...[0, 1, 2, 3, 4].map((i) => q.options[i] ?? ""), q.type === "MCQ" ? L[q.answer] : "", q.numericAnswer ?? "", q.solution, q.assetUrl ?? ""].map(cell).join(","));
  return "\uFEFF" + [CSV_COLS.join(","), ...lines].join("\r\n");
}

export const csvTemplate = () => "\uFEFF" + CSV_COLS.join(",") + "\r\n" +
  ["Maharashtra State Board", "10th", "Mathematics", "Quadratic Equations", "Roots", "Board Exam", "MCQ", "Easy", 1, 0, "Roots of $x^2-5x+6=0$ are:", "2, 3", "-2, -3", "1, 6", "-1, 6", "", "A", "", "$(x-2)(x-3)=0$", ""].map(cell).join(",") + "\r\n";

function parseRows(src: string): string[][] {
  const out: string[][] = []; let row: string[] = []; let f = ""; let q = false;
  const s = src.replace(/^\uFEFF/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; continue; }
    if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && s[i + 1] === "\n") i++; row.push(f); f = ""; if (row.some((x) => x.trim())) out.push(row); row = []; }
    else f += c;
  }
  row.push(f); if (row.some((x) => x.trim())) out.push(row);
  return out;
}

export function csvToBank(src: string): { rows: BankQuestion[]; errors: string[] } {
  const all = parseRows(src);
  const head = (all.shift() ?? []).map((h) => h.trim());
  const idx = (k: string) => head.indexOf(k);
  const missing = ["cls", "subject", "chapter", "type", "text"].filter((k) => idx(k) < 0);
  if (missing.length) return { rows: [], errors: [`Missing columns: ${missing.join(", ")}`] };
  const rows: BankQuestion[] = []; const errors: string[] = [];
  all.forEach((r, n) => {
    const g = (k: string) => (idx(k) >= 0 ? (r[idx(k)] ?? "").trim() : "");
    const line = n + 2;
    const cls = g("cls"); const type = g("type") || "MCQ";
    if (!(CLASSES as readonly string[]).includes(cls)) return void errors.push(`Row ${line}: class "${cls}" is not valid`);
    if (!(QTYPES as readonly string[]).includes(type)) return void errors.push(`Row ${line}: type "${type}" is not valid`);
    if (!g("text")) return void errors.push(`Row ${line}: question text is empty`);
    const options = ["optionA", "optionB", "optionC", "optionD", "optionE"].map(g).filter(Boolean);
    const answer = Math.max(0, L.indexOf(g("answer").toUpperCase()));
    if (type === "MCQ" && options.length < 2) return void errors.push(`Row ${line}: MCQ needs at least 2 options`);
    if (type === "MCQ" && answer >= options.length) return void errors.push(`Row ${line}: answer letter has no option`);
    const board = (BOARDS as readonly string[]).includes(g("board")) ? g("board") : "Maharashtra State Board";
    const cat = (EXAM_CATS as readonly string[]).includes(g("category")) ? g("category") : "Board Exam";
    const diff = (DIFFS as readonly string[]).includes(g("difficulty")) ? g("difficulty") : "Medium";
    rows.push({
      id: crypto.randomUUID(), createdAt: Date.now() + n, board: board as BankQuestion["board"], cls: cls as BankQuestion["cls"],
      subject: g("subject"), chapter: g("chapter"), topic: g("topic"), category: cat as BankQuestion["category"], type: type as BankQuestion["type"],
      difficulty: diff as BankQuestion["difficulty"], marks: Number(g("marks")) || 1, negative: Math.min(0, Number(g("negative")) || 0), text: g("text"),
      options: type === "MCQ" ? options : [], answer, numericAnswer: g("numericAnswer") || undefined, solution: g("solution"), assetUrl: g("assetUrl") || undefined,
    });
  });
  return { rows, errors };
}

export function saveText(name: string, text: string, mime = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
