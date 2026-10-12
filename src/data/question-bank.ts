// Question Bank taxonomy + types. Pure data, SSR-safe (no randomness at module scope).
export const BOARDS = ["Maharashtra State Board", "CBSE", "ICSE"] as const;
export const CLASSES = ["8th", "9th", "10th", "11th", "12th"] as const;
export const EXAM_CATS = ["Board Exam", "JEE", "NEET", "MHT-CET"] as const;
export const DIFFS = ["Easy", "Medium", "Hard"] as const;
export const QTYPES = ["MCQ", "Numerical", "Short Answer", "Long Answer"] as const;

export type Board = (typeof BOARDS)[number];
export type Cls = (typeof CLASSES)[number];
export type ExamCat = (typeof EXAM_CATS)[number];
export type Diff = (typeof DIFFS)[number];
export type QType = (typeof QTYPES)[number];

type Syllabus = Record<string, Record<string, string[]>>; // subject -> chapter -> topics

const junior: Syllabus = {
  Mathematics: {
    "Rational Numbers": ["Properties", "Number line"],
    "Linear Equations": ["One variable", "Word problems"],
    Mensuration: ["Area", "Surface area & volume"],
  },
  Science: {
    "Force and Pressure": ["Contact forces", "Pressure"],
    "Atoms and Molecules": ["Laws of combination", "Mole concept"],
    "Cell Structure": ["Cell organelles", "Plant vs animal cell"],
  },
};
const ten: Syllabus = {
  Mathematics: {
    "Real Numbers": ["Euclid's lemma", "Irrational numbers"],
    Polynomials: ["Zeroes", "Relation of zeroes & coefficients"],
    "Quadratic Equations": ["Roots", "Nature of roots"],
    Trigonometry: ["Ratios", "Identities", "Heights & distances"],
  },
  Science: {
    "Light — Reflection & Refraction": ["Mirrors", "Lenses"],
    Electricity: ["Ohm's law", "Resistors in series & parallel"],
    "Chemical Reactions": ["Balancing", "Types of reactions"],
    "Life Processes": ["Nutrition", "Respiration"],
  },
};
const senior11: Syllabus = {
  Physics: {
    "Units & Measurements": ["Dimensions", "Errors"],
    "Laws of Motion": ["Newton's laws", "Friction"],
    "Work, Energy & Power": ["Work-energy theorem", "Collisions"],
    Gravitation: ["Kepler's laws", "Escape velocity"],
  },
  Chemistry: {
    "Some Basic Concepts": ["Mole concept", "Stoichiometry"],
    "Atomic Structure": ["Bohr model", "Quantum numbers"],
    "Chemical Bonding": ["VSEPR", "Hybridisation"],
  },
  Mathematics: {
    "Sets & Functions": ["Venn diagrams", "Domain & range"],
    "Trigonometric Functions": ["Identities", "Equations"],
    "Sequences & Series": ["AP", "GP"],
  },
  Biology: {
    "Cell: Unit of Life": ["Organelles", "Cell division"],
    "Plant Physiology": ["Photosynthesis", "Respiration"],
  },
};
const senior12: Syllabus = {
  Physics: {
    Electrostatics: ["Coulomb's law", "Electric field", "Capacitance"],
    "Current Electricity": ["Kirchhoff's laws", "Wheatstone bridge"],
    "Ray Optics": ["Lens formula", "Prisms"],
    "Dual Nature of Matter": ["Photoelectric effect", "de Broglie"],
  },
  Chemistry: {
    Solutions: ["Concentration", "Colligative properties"],
    Electrochemistry: ["Nernst equation", "Conductance"],
    "Chemical Kinetics": ["Rate law", "Order of reaction"],
  },
  Mathematics: {
    "Integrals": ["Indefinite", "Definite", "By parts"],
    "Differential Equations": ["Order & degree", "Variable separable"],
    Probability: ["Conditional", "Bayes' theorem"],
  },
  Biology: {
    "Human Reproduction": ["Gametogenesis", "Fertilisation"],
    "Genetics & Evolution": ["Mendelian inheritance", "DNA replication"],
  },
};

const byClass: Record<Cls, Syllabus> = { "8th": junior, "9th": junior, "10th": ten, "11th": senior11, "12th": senior12 };

// Same chapter skeleton for all boards (boards differ in naming only); swap per-board here later.
export const subjectsFor = (_b: Board, c: Cls) => Object.keys(byClass[c]);
export const chaptersFor = (_b: Board, c: Cls, s: string) => Object.keys(byClass[c][s] ?? {});
export const topicsFor = (_b: Board, c: Cls, s: string, ch: string) => byClass[c][s]?.[ch] ?? [];

export type BankQuestion = {
  id: string;
  board: Board;
  cls: Cls;
  subject: string;
  chapter: string;
  topic: string;
  category: ExamCat;
  type: QType;
  difficulty: Diff;
  marks: number;
  negative: number;
  text: string; // supports $inline$ and $$block$$ LaTeX
  options: string[];
  answer: number; // MCQ index
  numericAnswer?: string | undefined;
  solution: string;
  assetUrl?: string | undefined;
  assetName?: string | undefined;
  createdAt: number;
};

type Seed = Omit<BankQuestion, "id" | "createdAt" | "board" | "options" | "answer" | "solution" | "negative" | "category"> &
  Partial<Pick<BankQuestion, "board" | "options" | "answer" | "solution" | "negative" | "category" | "numericAnswer">>;

const seeds: Seed[] = [
  { cls: "10th", subject: "Mathematics", chapter: "Quadratic Equations", topic: "Roots", type: "MCQ", difficulty: "Easy", marks: 1, text: "The roots of $x^2 - 5x + 6 = 0$ are:", options: ["2, 3", "-2, -3", "1, 6", "-1, 6"], answer: 0, solution: "$(x-2)(x-3)=0 \\Rightarrow x = 2, 3$" },
  { cls: "10th", subject: "Mathematics", chapter: "Quadratic Equations", topic: "Nature of roots", type: "MCQ", difficulty: "Medium", marks: 1, text: "For $2x^2 + kx + 2 = 0$ to have equal roots, $k$ =", options: ["±2", "±4", "±8", "0"], answer: 1, solution: "$D = k^2 - 16 = 0 \\Rightarrow k = \\pm 4$" },
  { cls: "10th", subject: "Mathematics", chapter: "Quadratic Equations", topic: "Nature of roots", type: "MCQ", difficulty: "Hard", marks: 2, text: "If one root of $x^2 + px + 12 = 0$ is 4, the value of $p$ is:", options: ["-7", "7", "-8", "3"], answer: 0, solution: "$16 + 4p + 12 = 0 \\Rightarrow p = -7$" },
  { cls: "10th", subject: "Mathematics", chapter: "Quadratic Equations", topic: "Roots", type: "Numerical", difficulty: "Medium", marks: 2, text: "Find the sum of the roots of $3x^2 - 12x + 5 = 0$.", numericAnswer: "4", solution: "Sum $= -b/a = 12/3 = 4$" },
  { cls: "10th", subject: "Mathematics", chapter: "Trigonometry", topic: "Identities", type: "MCQ", difficulty: "Easy", marks: 1, text: "$\\sin^2\\theta + \\cos^2\\theta =$", options: ["0", "1", "2", "$\\tan\\theta$"], answer: 1, solution: "Fundamental identity." },
  { cls: "10th", subject: "Mathematics", chapter: "Trigonometry", topic: "Ratios", type: "MCQ", difficulty: "Medium", marks: 1, text: "If $\\tan\\theta = 3/4$, then $\\sin\\theta$ =", options: ["3/5", "4/5", "3/4", "5/3"], answer: 0, solution: "Hypotenuse $=5$, so $\\sin\\theta = 3/5$." },
  { cls: "10th", subject: "Mathematics", chapter: "Real Numbers", topic: "Euclid's lemma", type: "Short Answer", difficulty: "Medium", marks: 2, text: "Use Euclid's division algorithm to find the HCF of 135 and 225.", solution: "$225 = 135\\times1 + 90$, $135 = 90\\times1+45$, $90 = 45\\times2$. HCF $= 45$." },
  { cls: "10th", subject: "Mathematics", chapter: "Polynomials", topic: "Zeroes", type: "MCQ", difficulty: "Easy", marks: 1, text: "The number of zeroes of $p(x) = x^2 - 4$ is:", options: ["0", "1", "2", "3"], answer: 2, solution: "$x = \\pm 2$" },
  { cls: "10th", subject: "Science", chapter: "Electricity", topic: "Ohm's law", type: "MCQ", difficulty: "Easy", marks: 1, text: "A 10 Ω resistor carries 2 A. The voltage across it is:", options: ["5 V", "12 V", "20 V", "0.2 V"], answer: 2, solution: "$V = IR = 20\\,V$" },
  { cls: "10th", subject: "Science", chapter: "Electricity", topic: "Resistors in series & parallel", type: "Numerical", difficulty: "Medium", marks: 2, text: "Two 6 Ω resistors are connected in parallel. Find the equivalent resistance (in Ω).", numericAnswer: "3", solution: "$R = \\frac{6\\times6}{12} = 3\\,\\Omega$" },
  { cls: "11th", subject: "Physics", chapter: "Laws of Motion", topic: "Newton's laws", type: "MCQ", difficulty: "Easy", marks: 4, negative: -1, category: "JEE", text: "A force of 10 N acts on a 2 kg mass. Its acceleration is:", options: ["2 m/s²", "5 m/s²", "20 m/s²", "0.2 m/s²"], answer: 1, solution: "$a = F/m = 5\\,m/s^2$" },
  { cls: "11th", subject: "Physics", chapter: "Gravitation", topic: "Escape velocity", type: "MCQ", difficulty: "Medium", marks: 4, negative: -1, category: "JEE", text: "Escape velocity from Earth's surface is given by:", options: ["$\\sqrt{gR}$", "$\\sqrt{2gR}$", "$2gR$", "$gR/2$"], answer: 1, solution: "$v_e = \\sqrt{2GM/R} = \\sqrt{2gR}$" },
  { cls: "11th", subject: "Chemistry", chapter: "Some Basic Concepts", topic: "Mole concept", type: "Numerical", difficulty: "Easy", marks: 4, category: "MHT-CET", text: "How many moles are present in 36 g of water?", numericAnswer: "2", solution: "$36/18 = 2$ mol" },
  { cls: "12th", subject: "Physics", chapter: "Electrostatics", topic: "Coulomb's law", type: "MCQ", difficulty: "Medium", marks: 4, negative: -1, category: "NEET", text: "If the distance between two charges is doubled, the force becomes:", options: ["Double", "Half", "One-fourth", "Four times"], answer: 2, solution: "$F \\propto 1/r^2$" },
  { cls: "12th", subject: "Mathematics", chapter: "Integrals", topic: "Definite", type: "MCQ", difficulty: "Medium", marks: 2, category: "MHT-CET", text: "$\\int_0^1 x\\,dx =$", options: ["0", "1/2", "1", "2"], answer: 1, solution: "$[x^2/2]_0^1 = 1/2$" },
  { cls: "12th", subject: "Chemistry", chapter: "Chemical Kinetics", topic: "Order of reaction", type: "Long Answer", difficulty: "Hard", marks: 5, text: "Derive the integrated rate equation for a first-order reaction and find its half-life.", solution: "$k = \\frac{2.303}{t}\\log\\frac{[R]_0}{[R]}$; $t_{1/2} = 0.693/k$" },
];

export function makeSeedBank(): BankQuestion[] {
  return seeds.map((s, i) => ({
    board: "Maharashtra State Board",
    category: "Board Exam",
    options: [],
    answer: 0,
    solution: "",
    negative: 0,
    ...s,
    id: `seed-q-${i + 1}`,
    createdAt: 1760000000000 + i,
  }));
}

/** Deterministic shuffle (seeded) so builder output is reproducible for a seed. */
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let x = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    x = (x * 1103515245 + 12345) % 2147483648;
    const j = x % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Pick questions for a paper: honours type, difficulty mix ("Mixed" spreads across levels), and count. */
export function pickQuestions(pool: BankQuestion[], count: number, difficulty: Diff | "Mixed", seed: number): BankQuestion[] {
  const shuffled = seededShuffle(pool, seed);
  if (difficulty !== "Mixed") return shuffled.filter((q) => q.difficulty === difficulty).slice(0, count);
  const buckets = DIFFS.map((d) => shuffled.filter((q) => q.difficulty === d));
  const out: BankQuestion[] = [];
  let i = 0;
  while (out.length < count && buckets.some((b) => b.length)) {
    const b = buckets[i % 3]!;
    const q = b.shift();
    if (q) out.push(q);
    i++;
  }
  return out;
}
