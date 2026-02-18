import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { spaceId, questionCount = 10, timeLimit = 30 } = await request.json();

  if (!spaceId) {
    return NextResponse.json({ error: "spaceId required" }, { status: 400 });
  }

  const space = store.getSpace(spaceId);
  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  const docTitles = space.documents.map((d) => d.title);

  // Generate exam questions from all documents in the space
  const questions = generateExamQuestions(docTitles, questionCount);

  return NextResponse.json({
    id: "exam-" + store.generateId(),
    title: \`\${space.name} Practice Exam\`,
    spaceId,
    questionCount: questions.length,
    timeLimit,
    questions,
    documentsCovered: docTitles,
  });
}

function generateExamQuestions(docTitles: string[], count: number) {
  const questionPool = [
    {
      id: "e1",
      question: "Which of the following best describes the genetic code?",
      options: [
        "A set of rules for DNA replication",
        "The rules by which genetic material is translated into proteins",
        "A method of gene expression regulation",
        "The structure of chromosomes",
      ],
      correctIndex: 1,
      explanation: "The genetic code is the set of rules by which information in DNA/RNA is translated into proteins by living cells.",
      source: docTitles[0] || "Document 1",
    },
    {
      id: "e2",
      question: "How many codons exist in the standard genetic code?",
      options: ["20", "32", "64", "128"],
      correctIndex: 2,
      explanation: "There are 64 codons total: 61 coding for amino acids and 3 stop codons.",
      source: docTitles[0] || "Document 1",
    },
    {
      id: "e3",
      question: "What is the difference between mitosis and meiosis?",
      options: [
        "Mitosis produces 4 cells, meiosis produces 2",
        "Mitosis produces identical cells, meiosis produces genetically diverse cells",
        "They are the same process",
        "Mitosis only occurs in plants",
      ],
      correctIndex: 1,
      explanation: "Mitosis produces two genetically identical daughter cells, while meiosis produces four genetically diverse haploid cells.",
      source: docTitles[1] || "Document 2",
    },
    {
      id: "e4",
      question: "What is the purpose of translation in molecular biology?",
      options: [
        "Copying DNA",
        "Converting mRNA into protein",
        "Repairing damaged DNA",
        "Cell division",
      ],
      correctIndex: 1,
      explanation: "Translation is the process by which ribosomes synthesize proteins from an mRNA template.",
      source: docTitles[0] || "Document 1",
    },
    {
      id: "e5",
      question: "Which organelle is responsible for protein synthesis?",
      options: ["Mitochondria", "Ribosome", "Golgi apparatus", "Nucleus"],
      correctIndex: 1,
      explanation: "Ribosomes are the molecular machines that read mRNA and assemble amino acids into proteins.",
      source: docTitles[0] || "Document 1",
    },
    {
      id: "e6",
      question: "What phase of the cell cycle does DNA replication occur?",
      options: ["G1 phase", "S phase", "G2 phase", "M phase"],
      correctIndex: 1,
      explanation: "DNA replication occurs during the S (synthesis) phase of the cell cycle.",
      source: docTitles[1] || "Document 2",
    },
    {
      id: "e7",
      question: "What is the start codon in translation?",
      options: ["UAA", "UAG", "AUG", "UGA"],
      correctIndex: 2,
      explanation: "AUG is the universal start codon that initiates protein synthesis and codes for methionine.",
      source: docTitles[0] || "Document 1",
    },
    {
      id: "e8",
      question: "What characterizes the G1 phase of the cell cycle?",
      options: [
        "DNA is replicated",
        "Cell grows and prepares for DNA synthesis",
        "Chromosomes separate",
        "Cytokinesis occurs",
      ],
      correctIndex: 1,
      explanation: "During G1, the cell grows, produces proteins, and prepares for DNA replication in S phase.",
      source: docTitles[1] || "Document 2",
    },
    {
      id: "e9",
      question: "Which type of RNA carries amino acids to the ribosome?",
      options: ["mRNA", "rRNA", "tRNA", "snRNA"],
      correctIndex: 2,
      explanation: "Transfer RNA (tRNA) carries specific amino acids to the ribosome during protein synthesis.",
      source: docTitles[0] || "Document 1",
    },
    {
      id: "e10",
      question: "What is the result of meiosis I?",
      options: [
        "Four haploid cells",
        "Two diploid cells",
        "Two haploid cells",
        "One tetraploid cell",
      ],
      correctIndex: 2,
      explanation: "Meiosis I is a reductional division that produces two haploid cells from one diploid cell.",
      source: docTitles[1] || "Document 2",
    },
  ];

  return questionPool.slice(0, Math.min(count, questionPool.length));
}
