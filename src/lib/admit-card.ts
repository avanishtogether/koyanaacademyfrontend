import type { AdmissionApplication } from "./portal-store";
import { academyInfo as A } from "./academy-info";

const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Opens a print-ready official admit card in a new window. */
export function printAdmitCard(a: AdmissionApplication) {
  const title = a.kind === "entrance" ? "NYT ENTRANCE EXAM — HALL TICKET" : "NYT TALENT OLYMPIAD — ADMIT CARD";
  const row = (k: string, v: string) => `<tr><th>${k}</th><td>${h(v || "—")}</td></tr>`;
  const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${a.rollNumber}</title><style>
body{font-family:Arial,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#111}
.card{border:2px solid #111;padding:18px}.hd{text-align:center;border-bottom:2px solid #111;padding-bottom:10px}
.hd h1{margin:0;font-size:22px}.hd p{margin:2px 0;font-size:12px}.t{background:#111;color:#fff;text-align:center;padding:6px;margin:12px 0;font-weight:bold;letter-spacing:1px}
.grid{display:flex;gap:16px}table{border-collapse:collapse;flex:1;font-size:13px}th,td{border:1px solid #888;padding:6px;text-align:left}th{width:38%;background:#f2f2f2}
.photo{width:130px;height:160px;border:1px dashed #555;display:flex;align-items:center;justify-content:center;font-size:11px;text-align:center}
ol{font-size:12px}.sig{display:flex;justify-content:space-between;margin-top:40px;font-size:12px}</style></head><body><div class="card">
<div class="hd"><h1>${h(A.name)}</h1><p>${h(A.college)}</p><p>${h(A.address)}</p><p>Contact: ${h(A.contactName)} · ${h(A.phone)}</p></div>
<div class="t">${title}</div>
<div class="grid"><table>${row("Roll number", a.rollNumber)}${row("Candidate name", a.studentName)}${row("Date of birth", a.dob)}${row("Class", a.targetClass)}${row("Stream", a.targetStream)}${row("School", a.currentSchool)}${row("Parent / guardian", a.parentName)}${row("Mobile", a.primaryPhone)}${row("Village / Taluka", `${a.villageTown}, ${a.taluka}`)}${row("Exam date & time", a.examSlot)}${row("Reporting", "30 minutes before exam time")}${row("Exam centre", `${A.college}, ${A.address}`)}</table>
<div class="photo">Paste recent<br/>passport photo</div></div>
<ol><li>Bring this admit card and a school ID card.</li><li>Carry a blue/black ball pen. Calculators and mobiles are not allowed.</li><li>Entry closes 15 minutes after the exam starts.</li><li>For help call ${h(A.contactName)} on ${h(A.phone)}.</li></ol>
<div class="sig"><span>Candidate signature</span><span>Parent signature</span><span>Exam In-charge (seal)</span></div>
</div><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(doc); w.document.close(); return; }
  const url = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
  const link = document.createElement("a");
  link.href = url; link.download = `${a.rollNumber}_admit_card.html`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
