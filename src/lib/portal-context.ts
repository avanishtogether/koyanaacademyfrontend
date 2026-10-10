import { createContext } from "react";
import type { Exam } from "@/data/exams";
import type { Notice, Material, Registration, ExamResult, AdmissionApplication, AppStatus, Memo, Milestone } from "./portal-store";

export type Store = {
  notices: Notice[];
  addNotice: (n: Omit<Notice, "id" | "time">) => void;
  materials: Material[];
  addMaterial: (m: Omit<Material, "id">) => void;
  exams: Exam[];
  registrations: Registration[];
  addExam: (e: Exam) => void;
  updateExam: (id: string, patch: Partial<Exam>) => void;
  register: (r: Omit<Registration, "id" | "hallTicket">) => Registration;
  results: ExamResult[];
  addResult: (r: ExamResult) => void;
  applications: AdmissionApplication[];
  addApplication: (a: AdmissionApplication) => void;
  setAppStatus: (roll: string, s: AppStatus) => void;
  memos: Memo[];
  addMemo: (m: Omit<Memo, "id" | "time" | "status">) => void;
  setMemoStatus: (id: string, s: Memo["status"]) => void;
  milestones: Milestone[];
  addMilestone: (m: Omit<Milestone, "id">) => void;
  setMilestoneStatus: (id: string, s: Milestone["status"]) => void;
};

export const PortalCtx = createContext<Store | null>(null);

