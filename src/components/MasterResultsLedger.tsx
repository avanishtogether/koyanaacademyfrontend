import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { usePortal } from "@/lib/use-portal";
import { downloadCsv } from "@/lib/downloads";

export function MasterResultsLedger() {
  const { results, exams } = usePortal();
  const examIds = [...new Set(results.map((r) => r.examId))];
  const [examId, setExamId] = useState(examIds[0] ?? "");
  const title = (id: string) => exams.find((e) => e.id === id)?.title ?? (id === "seed-jee-mock-3" ? "JEE Main Mock 3" : id);

  const rows = useMemo(() => results.filter((r) => r.examId === examId).sort((a, b) => b.score - a.score), [results, examId]);
  const subs = [...new Set(rows.flatMap((r) => Object.keys(r.subjects ?? {})))];
  const max = rows[0]?.max ?? 1;
  const avg = rows.length ? rows.reduce((s, r) => s + r.score, 0) / rows.length : 0;
  const pass = rows.length ? (rows.filter((r) => r.score / r.max >= 0.4).length / rows.length) * 100 : 0;
  const acc = (r: (typeof rows)[number]) => (r.correct + r.wrong ? Math.round((r.correct / (r.correct + r.wrong)) * 100) : 0);

  function exportCsv() {
    downloadCsv(`results-${examId}`, [["Rank", "Name", "Academy ID", ...subs, "Total", "Max", "Accuracy %", "Violations"],
      ...rows.map((r, i) => [i + 1, r.name ?? "—", r.studentId ?? "—", ...subs.map((s) => r.subjects?.[s] ?? ""), r.score, r.max, acc(r), r.violations])]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <select className="rounded-xl border border-input bg-secondary/50 px-3 py-2 text-sm" value={examId} onChange={(e) => setExamId(e.target.value)}>
          {examIds.map((id) => <option key={id} value={id}>{title(id)}</option>)}
        </select>
        <button onClick={exportCsv} disabled={!rows.length} className="neon-surface inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50"><Download className="size-4" /> Download Results Excel</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {[["Total appeared", rows.length], ["Highest score", `${rows[0]?.score ?? 0}/${max}`], ["Batch average", avg.toFixed(1)], ["Pass rate (≥40%)", `${pass.toFixed(0)}%`]].map(([l, v]) => (
          <div key={l as string} className="rounded-2xl bg-secondary/40 p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">{l}</p><p className="mt-1 font-display text-2xl font-bold">{v}</p></div>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-widest text-muted-foreground"><th className="py-2 pr-3">Rank</th><th>Name</th><th>ID</th>{subs.map((s) => <th key={s}>{s}</th>)}<th>Total</th><th>Accuracy</th><th>Violations</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.name}-${i}`} className="border-t border-border">
                <td className="py-2 pr-3 font-bold text-primary">#{i + 1}</td><td>{r.name ?? "—"}</td><td className="text-xs">{r.studentId ?? "—"}</td>
                {subs.map((s) => <td key={s}>{r.subjects?.[s] ?? "—"}</td>)}
                <td className="font-semibold">{r.score}/{r.max}</td><td>{acc(r)}%</td>
                <td className={r.violations ? "text-destructive" : ""}>{r.violations}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="py-6 text-center text-xs text-muted-foreground">No results yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
