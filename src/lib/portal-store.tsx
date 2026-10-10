import { useState, type ReactNode } from "react";
import { PortalCtx as Ctx, type Store } from "./portal-context";
import { seedExams } from "@/data/exams";

export type Dept = "Faculty" | "Admin & Finance" | "Exam Dept";
export type Notice = { id: string; title: string; body: string; audience: string; time: string; dept?: Dept; priority?: "Official Circular" | "Urgent" | "Routine" };
export type Material = { id: string; title: string; subject: string; track: string; cls: string; topic: string; size: string };
export type Registration = {
  id: string;
  examId: string;
  slotId: string;
  name: string;
  college: string;
  cls: string;
  email: string;
  hallTicket: string;
  studentId: string;
};
export type ExamResult = { examId: string; score: number; max: number; correct: number; wrong: number; skipped: number; violations: number; name?: string; studentId?: string; subjects?: Record<string, number> };
export type Application = { id: string; kind: "entrance" | "olympiad"; roll: string; name: string; school: string; cls: string; phone: string; slot: string; taluka: string; status: "Submitted" | "Verified" | "Admitted"; date: string };
export type Memo = { id: string; from: Dept; to: Dept | "All"; text: string; priority: "Routine" | "Important" | "Urgent"; status: "Open" | "In-Progress" | "Resolved"; time: string };

const seedApps: Application[] = [
  { id: "ap1", kind: "entrance", roll: "NYT-EN-40211", name: "Sakshi Jadhav", school: "Z.P. School Patan", cls: "Class 10", phone: "9822011223", slot: "2 Nov · 10:00 AM", taluka: "Patan", status: "Verified", date: "2026-10-02" },
  { id: "ap2", kind: "entrance", roll: "NYT-EN-40388", name: "Yash Pawar", school: "New English School Karad", cls: "Class 11", phone: "9763344556", slot: "9 Nov · 10:00 AM", taluka: "Karad", status: "Submitted", date: "2026-10-05" },
  { id: "ap3", kind: "olympiad", roll: "NYT-OL-51207", name: "Ananya Mane", school: "Shirala Vidyalaya", cls: "Class 8", phone: "9890077889", slot: "16 Nov · 11:00 AM", taluka: "Shirala", status: "Submitted", date: "2026-10-06" },
  { id: "ap4", kind: "olympiad", roll: "NYT-OL-51544", name: "Rohit Salunkhe", school: "Koregaon High School", cls: "Class 9", phone: "9423312345", slot: "23 Nov · 11:00 AM", taluka: "Koregaon", status: "Admitted", date: "2026-10-01" },
];

const seedResults: ExamResult[] = [
  ["Rahul Patil", "KA-2026-0415", 212, 4, { Physics: 68, Chemistry: 74, Maths: 70 }, 0],
  ["Sneha Kale", "KA-2026-0402", 236, 2, { Physics: 80, Chemistry: 78, Maths: 78 }, 1],
  ["Omkar Shinde", "KA-2026-0409", 158, 9, { Physics: 50, Chemistry: 58, Maths: 50 }, 2],
  ["Priya Joshi", "KA-2026-0411", 189, 5, { Physics: 62, Chemistry: 66, Maths: 61 }, 0],
  ["Aarav More", "KA-2026-0420", 96, 14, { Physics: 30, Chemistry: 36, Maths: 30 }, 3],
].map(([name, studentId, score, wrong, subjects, violations]) => ({
  examId: "seed-jee-mock-3", name: name as string, studentId: studentId as string, score: score as number, max: 300,
  correct: Math.round((score as number) / 4) + (wrong as number) / 4, wrong: wrong as number, skipped: 0,
  subjects: subjects as Record<string, number>, violations: violations as number,
}));

const seedMemos: Memo[] = [
  { id: "mm1", from: "Exam Dept", to: "Admin & Finance", text: "Print 120 hall tickets for JEE Mock 4 by Friday.", priority: "Urgent", status: "Open", time: "Today" },
  { id: "mm2", from: "Faculty", to: "Exam Dept", text: "Physics section of Mock 5 paper ready for review.", priority: "Important", status: "In-Progress", time: "Yesterday" },
];

const seedNotices: Notice[] = [
  { id: "n0", title: "Mock exam registration is open", body: "JEE Main Mock 4, MHT-CET Mock 2 and NEET Mock 3 — book your slot on the Exams page.", audience: "Students", time: "Today", dept: "Exam Dept", priority: "Official Circular" },
  { id: "n1", title: "Parent–Teacher Meeting", body: "Saturday 4 Oct, 10:00 AM at the main campus hall.", audience: "Parents", time: "Today", dept: "Admin & Finance", priority: "Routine" },
  { id: "n2", title: "JEE Mock 3 scheduled", body: "Sunday 5 Oct, 9:00 AM. Reporting time 8:30 AM.", audience: "All", time: "Yesterday", dept: "Exam Dept", priority: "Urgent" },
  { id: "n3", title: "Diwali break", body: "Classes pause 18–22 Oct. Self-study packets will be shared.", audience: "All", time: "2 days ago", dept: "Faculty", priority: "Routine" },
];

const seedMaterials: Material[] = [
  { id: "m1", title: "Electromagnetic Induction — Master Notes", subject: "Physics", track: "JEE", cls: "Class 12", topic: "Electromagnetism", size: "2.4 MB" },
  { id: "m2", title: "Rotational Dynamics Problem Bank", subject: "Physics", track: "JEE", cls: "Class 12", topic: "Mechanics", size: "1.9 MB" },
  { id: "m3", title: "Chemical Kinetics Summary", subject: "Chemistry", track: "MHT-CET", cls: "Class 12", topic: "Physical Chemistry", size: "1.1 MB" },
  { id: "m4", title: "Named Reactions Chart", subject: "Chemistry", track: "JEE", cls: "Class 12", topic: "Organic Chemistry", size: "780 KB" },
  { id: "m5", title: "Definite Integration Formula Bank", subject: "Maths", track: "JEE", cls: "Class 12", topic: "Calculus", size: "820 KB" },
  { id: "m6", title: "3D Geometry Practice Set", subject: "Maths", track: "MHT-CET", cls: "Class 12", topic: "Vectors & 3D", size: "1.3 MB" },
];

export function PortalProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState(seedNotices);
  const [materials, setMaterials] = useState(seedMaterials);
  const [exams, setExams] = useState(seedExams);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);

  function register(r: Omit<Registration, "id" | "hallTicket">) {
    const reg: Registration = {
      ...r,
      id: crypto.randomUUID(),
      hallTicket: `KA-${r.examId.slice(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 89999)}`,
    };
    setRegistrations((l) => [...l.filter((x) => x.examId !== r.examId), reg]);
    setExams((l) =>
      l.map((e) =>
        e.id === r.examId
          ? { ...e, slots: e.slots.map((s) => (s.id === r.slotId ? { ...s, booked: s.booked + 1 } : s)) }
          : e,
      ),
    );
    return reg;
  }

  return (
    <Ctx.Provider
      value={{
        notices,
        addNotice: (n) => setNotices((l) => [{ ...n, id: crypto.randomUUID(), time: "Just now" }, ...l]),
        materials,
        addMaterial: (m) => setMaterials((l) => [{ ...m, id: crypto.randomUUID() }, ...l]),
        exams,
        registrations,
        register,
        addExam: (e) => setExams((l) => [e, ...l.filter((x) => x.id !== e.id)]),
        updateExam: (id, patch) => setExams((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x))),
        results,
        addResult: (r) => setResults((l) => [...l.filter((x) => x.examId !== r.examId), r]),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

