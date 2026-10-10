import { useMemo, useState } from "react";
import { Download, MessageCircle, Phone, Search } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/motion";
import { usePortal } from "@/lib/use-portal";
import { downloadCsv } from "@/lib/downloads";
import type { Application } from "@/lib/portal-store";

const input = "rounded-xl border border-input bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary";
type Comp = "entrance" | "olympiad" | "mocks";
const next: Record<Application["status"], Application["status"] | null> = { Submitted: "Verified", Verified: "Admitted", Admitted: null };

export function RegistrationLedgers({ showActions = false }: { showActions?: boolean }) {
  const { applications, registrations, exams, setApplicationStatus } = usePortal();
  const [comp, setComp] = useState<Comp>("entrance");
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("All");
  const [sel, setSel] = useState<Application | null>(null);

  const apps = useMemo(
    () => applications.filter((a) => a.kind === comp && (cls === "All" || a.cls === cls) && `${a.name} ${a.roll} ${a.school} ${a.phone}`.toLowerCase().includes(q.toLowerCase())),
    [applications, comp, cls, q],
  );
  const mocks = useMemo(
    () => registrations.filter((r) => (cls === "All" || r.cls === cls) && `${r.name} ${r.studentId} ${r.hallTicket}`.toLowerCase().includes(q.toLowerCase())),
    [registrations, cls, q],
  );

  function exportCsv() {
    if (comp === "mocks") {
      downloadCsv("mock-registrations", [["Hall Ticket", "Name", "Academy ID", "Class", "Exam", "College", "Email"], ...mocks.map((r) => [r.hallTicket, r.name, r.studentId, r.cls, exams.find((e) => e.id === r.examId)?.title ?? r.examId, r.college, r.email])]);
    } else {
      downloadCsv(`${comp}-applications`, [["Roll", "Name", "School", "Class", "Taluka", "Parent Phone", "Slot", "Status", "Date"], ...apps.map((a) => [a.roll, a.name, a.school, a.cls, a.taluka, a.phone, a.slot, a.status, a.date])]);
    }
    toast.success("Excel sheet downloaded");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {([["entrance", "NYT Entrance"], ["olympiad", "Talent Olympiad"], ["mocks", "Mock Exams"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setComp(k)} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${comp === k ? "neon-surface" : "glass text-muted-foreground"}`}>
            {l} ({k === "mocks" ? registrations.length : applications.filter((a) => a.kind === k).length})
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input className={`${input} w-full pl-9`} placeholder="Search name, roll, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={input} value={cls} onChange={(e) => setCls(e.target.value)}>
          {["All", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"].map((c) => <option key={c}>{c}</option>)}
        </select>
        <button onClick={exportCsv} className="neon-surface inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"><Download className="size-4" /> Download Excel</button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          {comp === "mocks" ? (
            <>
              <thead><tr className="text-left text-xs uppercase tracking-widest text-muted-foreground"><th className="py-2 pr-3">Hall ticket</th><th>Name</th><th>Academy ID</th><th>Class</th><th>Exam</th></tr></thead>
              <tbody>
                {mocks.map((r) => (
                  <tr key={r.id} className="border-t border-border"><td className="py-2 pr-3 font-mono text-xs">{r.hallTicket}</td><td>{r.name}</td><td>{r.studentId}</td><td>{r.cls}</td><td className="text-xs">{exams.find((e) => e.id === r.examId)?.title}</td></tr>
                ))}
                {!mocks.length && <tr><td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">No mock registrations yet.</td></tr>}
              </tbody>
            </>
          ) : (
            <>
              <thead><tr className="text-left text-xs uppercase tracking-widest text-muted-foreground"><th className="py-2 pr-3">Roll</th><th>Name</th><th>Class</th><th>Taluka</th><th>Status</th><th>Contact</th></tr></thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="py-2 pr-3 font-mono text-xs">{a.roll}</td>
                    <td><button onClick={() => setSel(a)} className="font-medium text-primary hover:underline">{a.name}</button></td>
                    <td>{a.cls}</td><td>{a.taluka}</td>
                    <td>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{a.status}</span>
                      {showActions && next[a.status] && (
                        <button onClick={() => { setApplicationStatus(a.id, next[a.status]!); toast.success(`${a.name} → ${next[a.status]}`); }} className="ml-2 text-xs font-semibold text-primary">Mark {next[a.status]}</button>
                      )}
                    </td>
                    <td className="space-x-2">
                      <a href={`tel:+91${a.phone}`} className="inline-flex text-primary" aria-label="Call parent"><Phone className="size-4" /></a>
                      <a href={`https://wa.me/91${a.phone}`} target="_blank" rel="noreferrer" className="inline-flex text-success" aria-label="WhatsApp parent"><MessageCircle className="size-4" /></a>
                    </td>
                  </tr>
                ))}
                {!apps.length && <tr><td colSpan={6} className="py-6 text-center text-xs text-muted-foreground">No applications match.</td></tr>}
              </tbody>
            </>
          )}
        </table>
      </div>

      <Modal open={!!sel} onClose={() => setSel(null)}>
        {sel && (
          <div className="space-y-1 p-6 text-sm">
            <p className="text-xs uppercase tracking-widest text-primary">{sel.kind === "entrance" ? "Entrance application" : "Olympiad application"}</p>
            <p className="font-display text-2xl font-bold">{sel.name}</p>
            <p>Roll: {sel.roll}</p><p>School: {sel.school}</p><p>{sel.cls} · {sel.taluka} taluka</p>
            <p>Exam slot: {sel.slot}</p><p>Parent: +91 {sel.phone}</p><p>Status: {sel.status} · Applied {sel.date}</p>
            <div className="flex gap-2 pt-3">
              <a href={`tel:+91${sel.phone}`} className="neon-surface rounded-full px-4 py-2 text-xs font-semibold">Call parent</a>
              <button onClick={() => window.print()} className="glass rounded-full px-4 py-2 text-xs font-semibold">Reprint admit card</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
