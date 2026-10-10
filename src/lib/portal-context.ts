import { createContext } from "react";
import type { Exam } from "@/data/exams";
import type { Notice, Material, Registration, ExamResult, Application, Memo } from "./portal-store";

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
  applications: Application[];
  addApplication: (a: Omit<Application, "id" | "status" | "date">) => void;
  setApplicationStatus: (id: string, status: Application["status"]) => void;
  memos: Memo[];
  addMemo: (m: Omit<Memo, "id" | "status" | "time">) => void;
  setMemoStatus: (id: string, status: Memo["status"]) => void;
};

export const PortalCtx = createContext<Store | null>(null);
