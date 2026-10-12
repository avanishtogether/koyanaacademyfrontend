import { useState, type ReactNode } from "react";
import { PortalCtx as Ctx, type Store } from "./portal-context";
import { seedExams } from "@/data/exams";

export type Notice = { id: string; title: string; body: string; audience: string; time: string; dept?: Dept; priority?: "Official Circular" | "Urgent" | "Routine" };
export type Dept = "Exam Dept" | "Admin & Finance" | "Faculty" | "Academy Wide";
export type AppStatus = "Submitted" | "Verified" | "Admitted";
export type AdmissionApplication = {
  rollNumber: string; kind: "entrance" | "olympiad"; studentName: string; dob: string; gender: string;
  parentName: string; parentOccupation: string; primaryPhone: string; alternatePhone: string; email: string;
  address: string; villageTown: string; taluka: string; district: string; pincode: string;
  currentSchool: string; board: string; medium: string; targetClass: string; previousScore: string;
  targetStream: string; examSlot: string; applicationDate: string; status: AppStatus;
};
export type Memo = { id: string; fromDept: Dept; toDept: Dept | "All Departments"; subject: string; body: string; priority: "Routine" | "Important" | "Urgent"; status: "Open" | "In-Progress" | "Resolved"; time: string; senderName: string };
export type Milestone = { id: string; department: Dept; title: string; targetDate: string; phase: string; status: "Scheduled" | "In Progress" | "Completed" | "Urgent Attention"; assignedTo: string };
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
export type ExamResult = { examId: string; score: number; max: number; correct: number; wrong: number; skipped: number; violations: number; subjects?: Record<string, number> };

const seedNotices: Notice[] = [
  { dept: "Exam Dept", priority: "Official Circular", id: "n0", title: "Mock exam registration is open", body: "JEE Main Mock 4, MHT-CET Mock 2 and NEET Mock 3 — book your slot on the Exams page.", audience: "Students", time: "Today" },
  { id: "n1", title: "Parent–Teacher Meeting", body: "Saturday 4 Oct, 10:00 AM at the main campus hall.", audience: "Parents", time: "Today" },
  { id: "n2", title: "JEE Mock 3 scheduled", body: "Sunday 5 Oct, 9:00 AM. Reporting time 8:30 AM.", audience: "All", time: "Yesterday" },
  { id: "n3", title: "Diwali break", body: "Classes pause 18–22 Oct. Self-study packets will be shared.", audience: "All", time: "2 days ago" },
];

const seedMaterials: Material[] = [
  { id: "m1", title: "Electromagnetic Induction — Master Notes", subject: "Physics", track: "JEE", cls: "Class 12", topic: "Electromagnetism", size: "2.4 MB" },
  { id: "m2", title: "Rotational Dynamics Problem Bank", subject: "Physics", track: "JEE", cls: "Class 12", topic: "Mechanics", size: "1.9 MB" },
  { id: "m3", title: "Chemical Kinetics Summary", subject: "Chemistry", track: "MHT-CET", cls: "Class 12", topic: "Physical Chemistry", size: "1.1 MB" },
  { id: "m4", title: "Named Reactions Chart", subject: "Chemistry", track: "JEE", cls: "Class 12", topic: "Organic Chemistry", size: "780 KB" },
  { id: "m5", title: "Definite Integration Formula Bank", subject: "Maths", track: "JEE", cls: "Class 12", topic: "Calculus", size: "820 KB" },
  { id: "m6", title: "3D Geometry Practice Set", subject: "Maths", track: "MHT-CET", cls: "Class 12", topic: "Vectors & 3D", size: "1.3 MB" },
];

const seedApps: AdmissionApplication[] = [
  { rollNumber: "NYT-EN-41207", kind: "entrance", studentName: "Aditya Jadhav", dob: "2012-03-14", gender: "Male", parentName: "Suresh Jadhav", parentOccupation: "Farmer", primaryPhone: "9876501234", alternatePhone: "", email: "", address: "Near Gram Panchayat", villageTown: "Mhavashi", taluka: "Patan", district: "Satara", pincode: "415206", currentSchool: "Z.P. School Mhavashi", board: "State Board", medium: "Marathi", targetClass: "Class 9", previousScore: "88%", targetStream: "Foundation", examSlot: "2 Nov · 10:00 AM", applicationDate: "8 Oct 2026", status: "Submitted" },
  { rollNumber: "NYT-EN-52981", kind: "entrance", studentName: "Pooja Pawar", dob: "2010-07-02", gender: "Female", parentName: "Vijay Pawar", parentOccupation: "Teacher", primaryPhone: "9922334455", alternatePhone: "9822001122", email: "vpawar@gmail.com", address: "Shivaji Nagar", villageTown: "Karad", taluka: "Karad", district: "Satara", pincode: "415110", currentSchool: "Tilak High School", board: "State Board", medium: "Semi-English", targetClass: "Class 11", previousScore: "92.4%", targetStream: "PCB", examSlot: "9 Nov · 10:00 AM", applicationDate: "7 Oct 2026", status: "Verified" },
  { rollNumber: "NYT-OL-30418", kind: "olympiad", studentName: "Siddhi Mane", dob: "2011-11-21", gender: "Female", parentName: "Rajesh Mane", parentOccupation: "Shop owner", primaryPhone: "9765432109", alternatePhone: "", email: "", address: "Main Road", villageTown: "Patan", taluka: "Patan", district: "Satara", pincode: "415206", currentSchool: "New English School Patan", board: "State Board", medium: "English", targetClass: "Class 10", previousScore: "A+", targetStream: "PCM", examSlot: "16 Nov · 11:00 AM", applicationDate: "6 Oct 2026", status: "Submitted" },
  { rollNumber: "NYT-OL-61733", kind: "olympiad", studentName: "Rohan Desai", dob: "2013-01-09", gender: "Male", parentName: "Anil Desai", parentOccupation: "Driver", primaryPhone: "9011223344", alternatePhone: "", email: "", address: "Bus stand road", villageTown: "Koregaon", taluka: "Koregaon", district: "Satara", pincode: "415501", currentSchool: "Koregaon Vidyalaya", board: "CBSE", medium: "English", targetClass: "Class 8", previousScore: "81%", targetStream: "Foundation", examSlot: "23 Nov · 11:00 AM", applicationDate: "5 Oct 2026", status: "Admitted" },
];
const seedMemos: Memo[] = [
  { id: "mm1", fromDept: "Exam Dept", toDept: "Faculty", subject: "Question papers for Olympiad due", body: "Please submit Class 8–10 Olympiad papers by 25 Oct.", priority: "Important", status: "Open", time: "Today", senderName: "Exam In-charge" },
  { id: "mm2", fromDept: "Admin & Finance", toDept: "Exam Dept", subject: "Hall ticket printing", body: "Print 400 entrance hall tickets before 30 Oct.", priority: "Urgent", status: "In-Progress", time: "Yesterday", senderName: "Mr. Bhalekar Sir" },
];
const seedMilestones: Milestone[] = [
  { id: "ms1", department: "Admin & Finance", title: "Admissions drive — village school visits", targetDate: "2026-10-15", phase: "Admissions", status: "In Progress", assignedTo: "Mr. Bhalekar Sir" },
  { id: "ms2", department: "Exam Dept", title: "Entrance hall tickets release", targetDate: "2026-10-30", phase: "Pre-Exam", status: "Scheduled", assignedTo: "Exam In-charge" },
  { id: "ms3", department: "Exam Dept", title: "NYT Entrance Exam — Slot 1", targetDate: "2026-11-02", phase: "Exam Day", status: "Scheduled", assignedTo: "Exam Dept" },
  { id: "ms4", department: "Faculty", title: "Olympiad question paper submission", targetDate: "2026-10-25", phase: "Pre-Exam", status: "Urgent Attention", assignedTo: "Prof. Deshpande" },
  { id: "ms5", department: "Academy Wide", title: "Entrance result declaration", targetDate: "2026-11-12", phase: "Evaluation", status: "Scheduled", assignedTo: "All departments" },
];

export function PortalProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState(seedNotices);
  const [materials, setMaterials] = useState(seedMaterials);
  const [exams, setExams] = useState(seedExams);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [applications, setApps] = useState(seedApps);
  const [memos, setMemos] = useState(seedMemos);
  const [milestones, setMilestones] = useState(seedMilestones);

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
        applications,
        addApplication: (a) => setApps((l) => [a, ...l]),
        setAppStatus: (roll, status) => setApps((l) => l.map((x) => (x.rollNumber === roll ? { ...x, status } : x))),
        memos,
        addMemo: (m) => setMemos((l) => [{ ...m, id: crypto.randomUUID(), time: "Just now", status: "Open" }, ...l]),
        setMemoStatus: (id, status) => setMemos((l) => l.map((x) => (x.id === id ? { ...x, status } : x))),
        milestones,
        addMilestone: (m) => setMilestones((l) => [...l, { ...m, id: crypto.randomUUID() }]),
        setMilestoneStatus: (id, status) => setMilestones((l) => l.map((x) => (x.id === id ? { ...x, status } : x))),
        addResult: (r) => setResults((l) => [...l.filter((x) => x.examId !== r.examId), r]),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

