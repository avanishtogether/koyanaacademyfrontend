import { Loader2, Printer, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { generateStudyPlan } from "@/lib/ai.functions";

const input = "w-full rounded-xl border border-input bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary";

function md(s: string) {
  const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return esc.split("\n").map((l) => {
    const b = l.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    if (/^###?\s/.test(l)) return `<h3 class="mt-4 font-display text-lg font-bold">${b.replace(/^#+\s/, "")}</h3>`;
    if (/^#\s/.test(l)) return `<h2 class="mt-4 font-display text-xl font-bold">${b.slice(2)}</h2>`;
    if (/^\s*[-*]\s/.test(l)) return `<li class="ml-5 list-disc">${b.replace(/^\s*[-*]\s/, "")}</li>`;
    return l.trim() ? `<p class="mt-1">${b}</p>` : "";
  }).join("");
}

export function StudyPlanner({ recentScores }: { recentScores: string }) {
  const gen = useServerFn(generateStudyPlan);
  const [f, setF] = useState({ name: "Student", cls: "12th", goal: "JEE Main", weak: "", hours: 6, weeks: 4 });
  const [plan, setPlan] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const r = await gen({ data: { ...f, recentScores } });
      if (r.error) toast.error(r.error); else { setPlan(r.plan); toast.success("Your study plan is ready"); }
    } catch (e) { console.error(e); toast.error("Could not create the plan. Please try again."); }
    finally { setBusy(false); }
  }
  function print() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Study Plan</title></head><body style="font-family:Georgia,serif;max-width:800px;margin:24px auto">${md(plan)}</body></html>`);
    w.document.close(); w.print();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="glass space-y-3 rounded-3xl p-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold"><Sparkles className="size-5 text-primary" /> AI Study Planner</h3>
        <label className="block text-xs">Your name<input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="block text-xs">Class<select className={input} value={f.cls} onChange={(e) => setF({ ...f, cls: e.target.value })}>{["8th", "9th", "10th", "11th", "12th", "Dropper"].map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="block text-xs">Target exam<select className={input} value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })}>{["JEE Main", "JEE Advanced", "NEET", "MHT-CET", "Board Exam", "Olympiad"].map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="block text-xs">Weak topics<input className={input} placeholder="e.g. Rotational motion, Organic" value={f.weak} onChange={(e) => setF({ ...f, weak: e.target.value })} /></label>
        <label className="block text-xs">Study hours per day: {f.hours}<input type="range" min={1} max={14} value={f.hours} className="w-full" onChange={(e) => setF({ ...f, hours: +e.target.value })} /></label>
        <label className="block text-xs">Plan length: {f.weeks} weeks<input type="range" min={1} max={12} value={f.weeks} className="w-full" onChange={(e) => setF({ ...f, weeks: +e.target.value })} /></label>
        <button disabled={busy} onClick={run} className="neon-surface inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} {busy ? "Creating plan…" : "Create my plan"}
        </button>
      </div>
      <div className="glass rounded-3xl p-6">
        {plan ? (
          <>
            <div className="flex justify-end"><button onClick={print} className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"><Printer className="size-3.5" /> Print</button></div>
            <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: md(plan) }} />
          </>
        ) : <p className="text-sm text-muted-foreground">Fill in your details and press "Create my plan" to get a week-by-week timetable built around your weak topics and mock scores.</p>}
      </div>
    </div>
  );
}
