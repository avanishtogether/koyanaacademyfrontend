import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { SiteNav } from "@/components/SiteNav";
import { Modal } from "@/components/motion";
import { celebrate } from "@/lib/celebrate";
import { academyInfo as A } from "@/lib/academy-info";
import { usePortal } from "@/lib/use-portal";
import type { AdmissionApplication } from "@/lib/portal-store";
import { printAdmitCard } from "@/lib/admit-card";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "NYT Entrance & Olympiad Registration — Koyana Academy" },
      { name: "description", content: "Register for the NYT Entrance Exam (Class 8–11) or the NYT Talent Olympiad (Class 8–10) at Koyana Academy, Patan." },
      { property: "og:title", content: "NYT Entrance & Olympiad Registration — Koyana Academy" },
      { property: "og:description", content: "Apply for NYT entrance or the Olympiad and win special seats at Koyana Academy, Patan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admissions,
});

const input = "w-full rounded-xl border border-input bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:border-primary";
type Kind = "entrance" | "olympiad";

const classes: Record<Kind, string[]> = {
  entrance: ["Class 8", "Class 9", "Class 10", "Class 11"],
  olympiad: ["Class 8", "Class 9", "Class 10"],
};
const slots: Record<Kind, string[]> = {
  entrance: ["2 Nov · 10:00 AM", "9 Nov · 10:00 AM"],
  olympiad: ["16 Nov · 11:00 AM", "23 Nov · 11:00 AM"],
};
const talukas = ["Patan", "Karad", "Satara", "Shirala", "Koregaon", "Other"];

const empty = {
  studentName: "", dob: "", gender: "Male", parentName: "", parentOccupation: "", primaryPhone: "", alternatePhone: "", email: "",
  address: "", villageTown: "", taluka: "Patan", district: "Satara", pincode: "", currentSchool: "", board: "State Board",
  medium: "Marathi", targetClass: "Class 8", previousScore: "", targetStream: "Foundation", examSlot: slots.entrance[0]!,
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-xs font-medium text-muted-foreground">{label}<div className="mt-1">{children}</div></label>;
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 font-display text-sm font-semibold uppercase tracking-widest text-primary">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Admissions() {
  const { addApplication } = usePortal();
  const [kind, setKind] = useState<Kind>("entrance");
  const [f, setF] = useState(empty);
  const [slip, setSlip] = useState<AdmissionApplication | null>(null);
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  function pick(k: Kind) {
    setKind(k);
    setF((x) => ({ ...x, targetClass: classes[k][0]!, examSlot: slots[k][0]! }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const phone = f.primaryPhone.replace(/\D/g, "").slice(-10);
    if (f.studentName.trim().length < 2) return void toast.error("Enter the student's full name");
    if (!f.dob) return void toast.error("Enter date of birth");
    if (f.parentName.trim().length < 2) return void toast.error("Enter parent / guardian name");
    if (!/^[6-9]\d{9}$/.test(phone)) return void toast.error("Enter a valid 10-digit mobile number");
    if (f.alternatePhone && !/^[6-9]\d{9}$/.test(f.alternatePhone.replace(/\D/g, "").slice(-10))) return void toast.error("Alternate number looks wrong");
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return void toast.error("Email looks wrong (or leave it empty)");
    if (f.villageTown.trim().length < 2) return void toast.error("Enter village / town");
    if (!/^\d{6}$/.test(f.pincode)) return void toast.error("Enter a 6-digit pincode");
    if (f.currentSchool.trim().length < 2) return void toast.error("Enter current school name");
    const app: AdmissionApplication = {
      ...f,
      primaryPhone: phone,
      kind,
      rollNumber: `NYT-${kind === "entrance" ? "EN" : "OL"}-${Math.floor(10000 + Math.random() * 89999)}`,
      applicationDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      status: "Submitted",
    };
    addApplication(app);
    setSlip(app);
    setF({ ...empty, targetClass: classes[kind][0]!, examSlot: slots[kind][0]! });
    celebrate();
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-28">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Admissions 2026–27</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Join NYT Academy</h1>
        <p className="mt-2 text-sm text-muted-foreground">{A.college} · {A.address} · Help: {A.contactName}, <a className="text-primary" href={A.phoneHref}>{A.phone}</a></p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {([
            ["entrance", "NYT Entrance Exam", "Class 8, 9, 10 & 11 — get into our JEE / NEET / CET batches."],
            ["olympiad", "NYT Talent Olympiad", "Class 8–10, any school. Top ranks win special reserved seats."],
          ] as const).map(([k, t, d]) => (
            <button type="button" key={k} onClick={() => pick(k)} className={`rounded-3xl p-5 text-left ${kind === k ? "neon-surface" : "glass"}`}>
              <p className="font-display text-lg font-semibold">{t}</p>
              <p className="mt-1 text-xs opacity-80">{d}</p>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="glass mt-6 space-y-8 rounded-3xl p-6">
          <Section title="1 · Student details">
            <Field label="Full name (as on school record) *"><input className={input} maxLength={80} value={f.studentName} onChange={set("studentName")} /></Field>
            <Field label="Date of birth *"><input type="date" className={input} value={f.dob} onChange={set("dob")} /></Field>
            <Field label="Gender"><select className={input} value={f.gender} onChange={set("gender")}>{["Male", "Female", "Other"].map((x) => <option key={x}>{x}</option>)}</select></Field>
          </Section>
          <Section title="2 · Parent / guardian">
            <Field label="Parent / guardian name *"><input className={input} maxLength={80} value={f.parentName} onChange={set("parentName")} /></Field>
            <Field label="Occupation"><input className={input} maxLength={60} placeholder="Farmer, teacher, business…" value={f.parentOccupation} onChange={set("parentOccupation")} /></Field>
            <Field label="Mobile (calling / WhatsApp) *"><input type="tel" className={input} maxLength={15} value={f.primaryPhone} onChange={set("primaryPhone")} /></Field>
            <Field label="Alternate mobile"><input type="tel" className={input} maxLength={15} value={f.alternatePhone} onChange={set("alternatePhone")} /></Field>
            <Field label="Email (optional)"><input type="email" className={input} maxLength={100} value={f.email} onChange={set("email")} /></Field>
          </Section>
          <Section title="3 · Address">
            <Field label="House / street"><input className={input} maxLength={150} value={f.address} onChange={set("address")} /></Field>
            <Field label="Village / town *"><input className={input} maxLength={60} value={f.villageTown} onChange={set("villageTown")} /></Field>
            <Field label="Taluka"><select className={input} value={f.taluka} onChange={set("taluka")}>{talukas.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="District"><input className={input} maxLength={40} value={f.district} onChange={set("district")} /></Field>
            <Field label="Pincode *"><input inputMode="numeric" className={input} maxLength={6} value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value.replace(/\D/g, "") })} /></Field>
          </Section>
          <Section title="4 · Current schooling">
            <Field label="School name *"><input className={input} maxLength={120} value={f.currentSchool} onChange={set("currentSchool")} /></Field>
            <Field label="Board"><select className={input} value={f.board} onChange={set("board")}>{["State Board", "CBSE", "ICSE"].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Medium"><select className={input} value={f.medium} onChange={set("medium")}>{["Marathi", "Semi-English", "English"].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Last exam % or grade"><input className={input} maxLength={10} placeholder="e.g. 86% or A+" value={f.previousScore} onChange={set("previousScore")} /></Field>
          </Section>
          <Section title="5 · Program & exam slot">
            <Field label="Class for admission"><select className={input} value={f.targetClass} onChange={set("targetClass")}>{classes[kind].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Target stream"><select className={input} value={f.targetStream} onChange={set("targetStream")}>{["Foundation", "PCM", "PCB", "PCMB"].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Exam slot"><select className={input} value={f.examSlot} onChange={set("examSlot")}>{slots[kind].map((x) => <option key={x}>{x}</option>)}</select></Field>
          </Section>
          <button className="neon-surface w-full rounded-xl py-3 text-sm font-semibold">
            Submit application for {kind === "entrance" ? "Entrance Exam" : "Olympiad"}
          </button>
        </form>
      </main>

      <Modal open={!!slip} onClose={() => setSlip(null)}>
        {slip && (
          <div className="p-6 text-center">
            <p className="text-xs uppercase tracking-widest text-primary">{slip.kind === "entrance" ? "NYT Entrance Hall Ticket" : "NYT Olympiad Admit Card"}</p>
            <p className="neon-text mt-2 font-display text-3xl font-bold">{slip.rollNumber}</p>
            <p className="mt-3 text-sm">{slip.studentName} · {slip.targetClass} · {slip.currentSchool}</p>
            <p className="text-sm text-muted-foreground">Exam: {slip.examSlot} at {A.college}. Report 30 minutes early.</p>
            <p className="mt-2 text-xs text-muted-foreground">Questions? {A.contactName} · {A.phone}</p>
            <button onClick={() => printAdmitCard(slip)} className="neon-surface mt-5 rounded-full px-5 py-2 text-sm font-semibold">Print / save admit card</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
