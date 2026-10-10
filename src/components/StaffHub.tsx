import { useState, type FormEvent } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { usePortal } from "@/lib/use-portal";
import { academyInfo as A } from "@/lib/academy-info";
import type { Dept, Memo } from "@/lib/portal-store";

const input = "w-full rounded-xl border border-input bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary";
const depts: Dept[] = ["Faculty", "Admin & Finance", "Exam Dept"];
const pri: Record<Memo["priority"], string> = { Routine: "bg-secondary", Important: "bg-primary/15 text-primary", Urgent: "bg-destructive/15 text-destructive" };

export function ContactDirectory() {
  const contacts = [
    { name: A.contactName, role: "Admin & Admissions (SPOC)", phone: A.phone.replace(/\D/g, "").slice(-10), email: "admissions@koyanaacademy.in" },
    { name: "Prof. Deshpande", role: "Academic Faculty Lead", phone: "9876500011", email: "faculty@koyanaacademy.in" },
    { name: "Exam In-charge", role: "Koyana Test Centre", phone: "9876500022", email: "exams@koyanaacademy.in" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {contacts.map((c) => (
        <div key={c.name} className="rounded-2xl bg-secondary/40 p-4">
          <p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">{c.role} · +91 {c.phone}</p>
          <div className="mt-3 flex gap-3">
            <a href={`tel:+91${c.phone}`} aria-label="Call" className="text-primary"><Phone className="size-4" /></a>
            <a href={`https://wa.me/91${c.phone}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="text-success"><MessageCircle className="size-4" /></a>
            <a href={`mailto:${c.email}`} aria-label="Email" className="text-muted-foreground"><Mail className="size-4" /></a>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MemoBoard({ from }: { from: Dept }) {
  const { memos, addMemo, setMemoStatus } = usePortal();
  const [m, setM] = useState({ text: "", to: "All" as Dept | "All", priority: "Routine" as Memo["priority"] });
  function send(e: FormEvent) {
    e.preventDefault();
    if (!m.text.trim()) { toast.error("Write a memo"); return; }
    addMemo({ ...m, from });
    setM({ ...m, text: "" });
    toast.success("Memo posted");
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={send} className="space-y-3">
        <textarea className={`${input} min-h-24`} placeholder={`Memo from ${from}…`} value={m.text} onChange={(e) => setM({ ...m, text: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <select className={input} value={m.to} onChange={(e) => setM({ ...m, to: e.target.value as Dept | "All" })}>{["All", ...depts].map((d) => <option key={d}>{d}</option>)}</select>
          <select className={input} value={m.priority} onChange={(e) => setM({ ...m, priority: e.target.value as Memo["priority"] })}>{Object.keys(pri).map((d) => <option key={d}>{d}</option>)}</select>
        </div>
        <button className="neon-surface rounded-full px-5 py-2 text-sm font-semibold">Post memo</button>
      </form>
      <div className="space-y-2">
        {memos.map((x) => (
          <div key={x.id} className="rounded-2xl bg-secondary/40 px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${pri[x.priority]}`}>{x.priority}</span>
              <span className="text-muted-foreground">{x.from} → {x.to} · {x.time}</span>
              <select value={x.status} onChange={(e) => setMemoStatus(x.id, e.target.value as Memo["status"])} className="ml-auto rounded-lg bg-secondary px-2 py-0.5">
                {["Open", "In-Progress", "Resolved"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <p className={`mt-1 ${x.status === "Resolved" ? "line-through opacity-60" : ""}`}>{x.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const milestones: { title: string; date: string; dept: Dept; status: "Scheduled" | "In Progress" | "Completed" | "Urgent Attention" }[] = [
  { title: "NYT Admissions drive (Patan, Karad, Koregaon)", date: "1–31 Oct", dept: "Admin & Finance", status: "In Progress" },
  { title: "Hall ticket release — NYT Entrance", date: "28 Oct", dept: "Admin & Finance", status: "Scheduled" },
  { title: "JEE Main Mock 4", date: "2 Nov", dept: "Exam Dept", status: "Scheduled" },
  { title: "OMR scanning deadline — Mock 3", date: "8 Oct", dept: "Exam Dept", status: "Urgent Attention" },
  { title: "Mock 3 result announcement", date: "10 Oct", dept: "Exam Dept", status: "Scheduled" },
  { title: "Rotational Dynamics chapter completion", date: "5 Oct", dept: "Faculty", status: "Completed" },
  { title: "NYT Talent Olympiad", date: "16 Nov", dept: "Exam Dept", status: "Scheduled" },
];
const stCls = { Scheduled: "bg-secondary", "In Progress": "bg-primary/15 text-primary", Completed: "bg-success/15 text-success", "Urgent Attention": "bg-destructive/15 text-destructive" };

export function ExecutionPlan() {
  const [f, setF] = useState<Dept | "All">("All");
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(["All", ...depts] as const).map((d) => <button key={d} onClick={() => setF(d)} className={`rounded-full px-3 py-1 text-xs font-semibold ${f === d ? "neon-surface" : "glass text-muted-foreground"}`}>{d}</button>)}
      </div>
      <ol className="mt-4 space-y-2 border-l border-border pl-4">
        {milestones.filter((m) => f === "All" || m.dept === f).map((m) => (
          <li key={m.title} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="w-20 text-xs text-muted-foreground">{m.date}</span>
            <span className="flex-1 font-medium">{m.title}</span>
            <span className="text-xs text-muted-foreground">{m.dept}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stCls[m.status]}`}>{m.status}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function NoticeBadges({ dept, priority }: { dept?: string; priority?: string }) {
  if (!dept && !priority) return null;
  return (
    <span className="mr-2 inline-flex gap-1 align-middle">
      {dept && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">[{dept}]</span>}
      {priority && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priority === "Urgent" ? "bg-destructive/15 text-destructive" : "bg-secondary text-foreground"}`}>{priority}</span>}
    </span>
  );
}
