import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { streamResponsesText } from "./ai-gateway.server";

const qSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "options", "answerIndex", "numericAnswer", "solution", "marks", "negative", "cls", "subject", "chapter", "topic", "difficulty", "type"],
        properties: {
          text: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          answerIndex: { type: "number" },
          numericAnswer: { type: "string" },
          solution: { type: "string" },
          marks: { type: "number" },
          negative: { type: "number" },
          cls: { type: "string" },
          subject: { type: "string" },
          chapter: { type: "string" },
          topic: { type: "string" },
          difficulty: { type: "string" },
          type: { type: "string" },
        },
      },
    },
  },
};

export type ExtractedQ = {
  text: string; options: string[]; answerIndex: number; numericAnswer: string; solution: string; marks: number; negative: number;
  cls: string; subject: string; chapter: string; topic: string; difficulty: string; type: string;
};

export const extractQuestions = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ text: z.string().min(20).max(80000), taxonomy: z.string().max(20000), hintClass: z.string().max(10) }).parse(d))
  .handler(async ({ data }): Promise<{ questions: ExtractedQ[]; error?: string }> => {
    const r = await streamResponsesText({
      instructions:
        "You extract exam questions from text copied out of a PDF question paper for an Indian coaching academy. " +
        "Return every question. Keep maths as LaTeX wrapped in $...$. For MCQs put options without their A/B/C/D labels. " +
        "answerIndex is the 0-based correct option if an answer key or marking shows it, else -1. numericAnswer is '' unless it is a numerical question. " +
        "type is one of MCQ, Numerical, Short Answer, Long Answer. difficulty is Easy, Medium or Hard. cls is one of 8th, 9th, 10th, 11th, 12th. " +
        "Pick subject, chapter and topic from the taxonomy below when possible, otherwise a short sensible name. marks default 1 and negative 0 (negative is <= 0) unless the paper states otherwise.\n\nTaxonomy:\n" + data.taxonomy,
      input: [{ role: "user", content: `Most likely class: ${data.hintClass}\n\nPAPER TEXT:\n${data.text}` }],
      text: { format: { type: "json_schema", name: "questions", strict: true, schema: qSchema } },
    });
    if (r.error !== undefined) return { questions: [], error: r.error };
    try { return { questions: (JSON.parse(r.text) as { questions: ExtractedQ[] }).questions ?? [] }; }
    catch { return { questions: [], error: "The AI answer could not be read. Try a smaller part of the paper." }; }
  });

export const generateStudyPlan = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    name: z.string().max(80), cls: z.string().max(20), goal: z.string().max(60), weak: z.string().max(300),
    hours: z.number().min(1).max(16), weeks: z.number().min(1).max(26), recentScores: z.string().max(500),
  }).parse(d))
  .handler(async ({ data }): Promise<{ plan: string; error?: string }> => {
    const r = await streamResponsesText({
      instructions:
        "You are a senior JEE/NEET/MHT-CET mentor at Koyana Academy, Patan (Maharashtra). Write a practical, encouraging study plan in simple English. " +
        "Use markdown: a short summary, then '## Week N' sections with day-wise bullet points (subject, chapter, task, time), weekly mock-test and revision slots, and a final '## Tips' list. Keep it under 900 words.",
      input: [{ role: "user", content: `Student: ${data.name}, ${data.cls}. Target exam: ${data.goal}. Weak areas: ${data.weak || "not specified"}. Study hours per day: ${data.hours}. Plan length: ${data.weeks} weeks. Recent mock scores: ${data.recentScores || "n/a"}.` }],
    });
    if (r.error !== undefined) return { plan: "", error: r.error };
    return { plan: r.text };
  });
