import { useMemo, useState } from "react";
import { Download, Phone, Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { usePortal } from "@/lib/use-portal";
import { downloadCsv } from "@/lib/downloads";
import { printAdmitCard } from "@/lib/admit-card";
import { Modal } from "@/components/motion";
import type { AdmissionApplication, AppStatus } from "@/lib/portal-store";

const btn = "glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold hover:text-primary";
const pill = (on: boolean) => `rounded-full px-3 py-1 text-xs font-semibold ${on ? "neon-surface" : "glass text-muted-foreground"}`;
const th = "whitespace-nowrap px-3 py-2 text-left text-[11px] uppercase tracking-widest text-muted-foreground";
const td = "whitespace-nowrap px-3 py-2";
const statusTone: Record<AppStatus, string> = { Submitted: "bg-secondary text-foreground", Verified: "bg-primary/15 text-primary", Admitted: "bg-success/15 text-success" };

type Comp = "mocks" | "olympiad" | "entrance";

export function RegistrationLedgers({ allowStatus = false }: { allowStatus?: boolean }) {
  const { exams, registrations, results, applications, setAppStatus } = usePortal();
  const [comp, setComp] = useState<Comp>("entrance");
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("All");
  const [open, setOpen] = useState<AdmissionApplication | null>(null);
  const s = q.trim().toLowerCase();

  const apps = useMemo(
    () => applications.filter((a) => a.kind === comp && (cls === "All" || a.targetClass === cls) &&
      (!s || [a.studentName, a.rollNumber, a.currentSchool, a.primaryPhone, a.villageTown].some((v) => v.toLowerCase().includes(s)))),
    [applications, comp, cls, s],
  );
  const mocks = registrations.filter((r) => !s || [r.name, r.studentId, r.hallTicket].some((v) => v.toLowerCase().includes(s)));

  function exportApps() {
    downloadCsv(`${comp}_registrations.csv`, [
      ["Roll", "Name", "DOB", "Gender", "Parent", "Occupation", "Mobile", "Alt mobile", "Email", "Address", "Village", "Taluka", "District", "Pincode", "School", "Board", "Medium", "Class", "Prev score", "Stream", "Slot", "Applied", "Status"],
      ...apps.map((a) => [a.rollNumber, a.studentName, a.dob, a.gender, a.parentName, a.parentOccupation, a.primaryPhone, a.alternatePhone, a.email, a.address, a.villageTown, a.taluka, a.district, a.pincode, a.currentSchool, a.board, a.medium, a.targetClass, a.previousScore, a.targetStream, a.examSlot, a.applicationDate, a.status]),
    ]);
    toast.success("Excel sheet downloaded");
  }
  function exportMocks() {
    downloadCsv("mock_registrations.csv", [
      ["Exam", "Slot", "Name", "Academy ID", "Class", "Hall ticket", "Status", "Score"],
      ...mocks.map((r) => {
        const e = exams.find((x) => x.id === r.examId);
        const sl = e?.slots.find((x) => x.id === r.slotId);
        const res = results.find((x) => x.examId === r.examId);
        return [e?.name ?? r.examId, sl ? `${sl.date} ${sl.time}` : "", r.name, r.studentId, r.cls, r.hallTicket, res ? "Submitted" : "Pending", res ? `${res.score}/${res.max}` : ""];
      }),
    ]);
    toast.success("Excel sheet downloaded");
  }

  const clsOptions = comp === "olympiad" ? ["All", "Class 8", "Class 9", "Class 10"] : ["All", "Class 8", "Class 9", "Class 10", "Class 11"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {([["entrance", "NYT Entrance / Admissions"], ["olympiad", "NYT Talent Olympiad"], ["mocks", "Internal Mock Exams"]] as const).map(([k, l]) => (
          <button key={k} className={pill(comp === k)} onClick={() => { setComp(k); setCls("All"); }}>
            {l} ({k === "mocks" ? registrations.length : applications.filter((a) => a.kind === k).length})
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, roll, school, mobile…"
            className="w-full rounded-xl border border-input bg-secondary/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary" />
        </div>
        {comp !== "mocks" && clsOptions.map((c) => <button key={c} className={pill(cls === c)} onClick={() => setCls(c)}>{c}</button>)}
        <button className="neon-surface inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold" onClick={comp === "mocks" ? exportMocks : exportApps}>
          <Download className="size-4" /> Download Excel
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-secondary/30">
        {comp === "mocks" ? (
          <table className="w-full text-sm">
            <thead><tr>{["Student", "Academy ID", "Exam", "Slot", "Hall ticket", "Status", "Score"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {mocks.map((r) => {
                const e = exams.find((x) => x.id === r.examId);
                const sl = e?.slots.find((x) => x.id === r.slotId);
                const res = results.find((x) => x.examId === r.examId);
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className={`${td} font-medium`}>{r.name}</td><td className={td}>{r.studentId}</td><td className={td}>{e?.name}</td>
                    <td className={td}>{sl ? `${sl.date} ${sl.time}` : "—"}</td><td className={td}>{r.hallTicket}</td>
                    <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs ${res ? "bg-success/15 text-success" : "bg-secondary"}`}>{res ? "Submitted" : "Pending"}</span></td>
                    <td className={td}>{res ? `${res.score}/${res.max}` : "—"}</td>
                  </tr>
                );
              })}
              {!mocks.length && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No mock exam bookings yet.</td></tr>}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead><tr>{["Roll", "Student", "Class", "Stream", "School", "Village / Taluka", "Prev %", "Slot", "Call parent", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.rollNumber} onClick={() => setOpen(a)} className="cursor-pointer border-t border-border hover:bg-secondary/50">
                  <td className={`${td} font-mono text-xs`}>{a.rollNumber}</td><td className={`${td} font-medium`}>{a.studentName}</td>
                  <td className={td}>{a.targetClass}</td><td className={td}>{a.targetStream}</td><td className={td}>{a.currentSchool}</td>
                  <td className={td}>{a.villageTown}, {a.taluka}</td><td className={td}>{a.previousScore || "—"}</td><td className={td}>{a.examSlot}</td>
                  <td className={td}><a onClick={(e) => e.stopPropagation()} href={`tel:+91${a.primaryPhone}`} className="inline-flex items-center gap-1 text-primary"><Phone className="size-3.5" />{a.primaryPhone}</a></td>
                  <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone[a.status]}`}>{a.status}</span></td>
                </tr>
              ))}
              {!apps.length && <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">No applications match.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Tap any row to see the full application. Excel sheets open in Microsoft Excel and Google Sheets with Marathi text intact.</p>

      <Modal open={!!open} onClose={() => setOpen(null)}>
        {open && (
          <div className="max-h-[80vh] overflow-y-auto p-6">
            <p className="text-xs uppercase tracking-widest text-primary">{open.kind === "entrance" ? "Entrance application" : "Olympiad application"} · {open.rollNumber}</p>
            <h3 className="mt-1 font-display text-2xl font-bold">{open.studentName}</h3>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {([
                ["DOB", open.dob], ["Gender", open.gender], ["Parent", open.parentName], ["Occupation", open.parentOccupation],
                ["Mobile", open.primaryPhone], ["Alternate", open.alternatePhone], ["Email", open.email], ["Address", open.address],
                ["Village", open.villageTown], ["Taluka / District", `${open.taluka}, ${open.district}`], ["Pincode", open.pincode],
                ["School", open.currentSchool], ["Board / Medium", `${open.board} · ${open.medium}`], ["Previous score", open.previousScore],
                ["Class / Stream", `${open.targetClass} · ${open.targetStream}`], ["Slot", open.examSlot], ["Applied on", open.applicationDate],
              ] as const).map(([k, v]) => (
                <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v || "—"}</dd></div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`tel:+91${open.primaryPhone}`} className={btn}><Phone className="size-3.5" /> Call</a>
              <a href={`https://wa.me/91${open.primaryPhone}`} target="_blank" rel="noreferrer" className={btn}>WhatsApp</a>
              <button className={btn} onClick={() => printAdmitCard(open)}><Printer className="size-3.5" /> Re-print admit card</button>
            </div>
            {allowStatus && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                {(["Submitted", "Verified", "Admitted"] as const).map((st) => (
                  <button key={st} className={pill(open.status === st)} onClick={() => { setAppStatus(open.rollNumber, st); setOpen({ ...open, status: st }); toast.success(`Marked ${st}`); }}>{st}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export function ResultsLedger() {
  const { exams, results, registrations } = usePortal();
  const withResults = exams.filter((e) => results.some((r) => r.examId === e.id));
  const [examId, setExamId] = useState<string>("all");
  const list = results.filter((r) => examId === "all" || r.examId === examId);
  const rows = list
    .map((r) => {
      const reg = registrations.find((x) => x.examId === r.examId);
      const att = r.correct + r.wrong;
      return { ...r, name: reg?.name ?? "Rahul Patil", id: reg?.studentId ?? "KA-2026-0415", exam: exams.find((e) => e.id === r.examId)?.name ?? r.examId, pct: r.max ? (r.score / r.max) * 100 : 0, acc: att ? Math.round((r.correct / att) * 100) : 0 };
    })
    .sort((a, b) => b.pct - a.pct);
  const avg = rows.length ? rows.reduce((s, r) => s + r.pct, 0) / rows.length : 0;
  const pass = rows.length ? Math.round((rows.filter((r) => r.pct >= 35).length / rows.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {([["Total appeared", rows.length], ["Highest", rows[0] ? `${rows[0].score}/${rows[0].max}` : "—"], ["Average", `${avg.toFixed(1)}%`], ["Pass rate (≥35%)", `${pass}%`]] as const).map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-secondary/40 p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 font-display text-2xl font-bold">{v}</p></div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className={pill(examId === "all")} onClick={() => setExamId("all")}>All exams</button>
        {withResults.map((e) => <button key={e.id} className={pill(examId === e.id)} onClick={() => setExamId(e.id)}>{e.name}</button>)}
        <button className="neon-surface ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
          onClick={() => downloadCsv("merit_list.csv", [["Rank", "Name", "Academy ID", "Exam", "Subjects", "Score", "Max", "Accuracy %", "Warnings"], ...rows.map((r, i) => [i + 1, r.name, r.id, r.exam, Object.entries(r.subjects ?? {}).map(([k, v]) => `${k}:${v}`).join(" "), r.score, r.max, r.acc, r.violations])])}>
          <Download className="size-4" /> Download Excel
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-secondary/30">
        <table className="w-full text-sm">
          <thead><tr>{["Rank", "Student", "Academy ID", "Exam", "Subject breakdown", "Score", "Accuracy", "Warnings"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.examId}-${i}`} className="border-t border-border">
                <td className={`${td} font-display font-bold text-primary`}>#{i + 1}</td><td className={`${td} font-medium`}>{r.name}</td><td className={td}>{r.id}</td><td className={td}>{r.exam}</td>
                <td className={td}>{Object.entries(r.subjects ?? {}).map(([k, v]) => <span key={k} className="mr-2 text-xs">{k}: <b>{v}</b></span>)}</td>
                <td className={`${td} font-semibold`}>{r.score}/{r.max}</td><td className={td}>{r.acc}%</td>
                <td className={td}><span className={r.violations ? "text-destructive" : "text-success"}>{r.violations}</span></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No results yet. Results appear here as soon as students submit a mock exam.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
