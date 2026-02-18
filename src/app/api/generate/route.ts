import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { documentId, type } = await request.json();

  const store = (globalThis as any).__documentStore as Map<string, any>;
  let docTitle = "Document";

  if (store && documentId) {
    const doc = store.get(documentId);
    if (doc) docTitle = doc.title;
  }

  if (type === "flashcards") {
    const flashcards = [
      {
        id: "1",
        front: "What is the genetic code?",
        back: "The set of rules by which information encoded in genetic material (DNA or RNA) is translated into proteins by living cells.",
      },
      {
        id: "2",
        front: "What is a codon?",
        back: "A sequence of three nucleotides that together form a unit of genetic code in a DNA or RNA molecule, specifying a particular amino acid.",
      },
      {
        id: "3",
        front: "What is translation in molecular biology?",
        back: "The process by which ribosomes synthesize proteins using the mRNA template, linking amino acids in a specific order.",
      },
      {
        id: "4",
        front: "How many codons exist in the genetic code?",
        back: "There are 64 codons in total — 61 that code for amino acids and 3 stop codons (UAA, UAG, UGA).",
      },
      {
        id: "5",
        front: "What is the wobble hypothesis?",
        back: "The hypothesis stating that the third nucleotide in a codon can form non-standard base pairs (wobble) with the first nucleotide of the anticodon, allowing a single tRNA to recognize more than one codon.",
      },
      {
        id: "6",
        front: "What are the three stop codons?",
        back: "UAA (ochre), UAG (amber), and UGA (opal) — these signal the termination of protein synthesis.",
      },
      {
        id: "7",
        front: "What is the start codon?",
        back: "AUG — it codes for methionine and signals the start of translation. It is the first codon read during protein synthesis.",
      },
      {
        id: "8",
        front: "What is tRNA?",
        back: "Transfer RNA — a small RNA molecule that carries a specific amino acid to the ribosome during translation. It has an anticodon region that base-pairs with mRNA codons.",
      },
    ];

    return NextResponse.json({ flashcards, docTitle });
  }

  if (type === "quiz") {
    const questions = [
      {
        id: "1",
        question: "What is the primary function of mRNA in translation?",
        options: [
          "Carries amino acids to the ribosome",
          "Serves as the template for protein synthesis",
          "Catalyzes peptide bond formation",
          "Provides energy for translation",
        ],
        correctIndex: 1,
        explanation:
          "mRNA (messenger RNA) carries the genetic code from DNA to the ribosome, serving as the template that specifies the order of amino acids during protein synthesis.",
      },
      {
        id: "2",
        question: "How many nucleotides make up a codon?",
        options: ["1", "2", "3", "4"],
        correctIndex: 2,
        explanation:
          "A codon consists of three consecutive nucleotides that specify a particular amino acid or stop signal during translation.",
      },
      {
        id: "3",
        question: "Which codon serves as both the start codon and codes for methionine?",
        options: ["UAA", "AUG", "UGA", "GCA"],
        correctIndex: 1,
        explanation:
          "AUG is the universal start codon that initiates translation and codes for the amino acid methionine.",
      },
      {
        id: "4",
        question: "What does the wobble hypothesis explain?",
        options: [
          "Why DNA replication is semi-conservative",
          "How a single tRNA can recognize multiple codons",
          "Why proteins fold into specific shapes",
          "How genes are regulated",
        ],
        correctIndex: 1,
        explanation:
          "The wobble hypothesis explains that the third position of a codon can form non-standard base pairs, allowing one tRNA to recognize more than one codon for the same amino acid.",
      },
      {
        id: "5",
        question: "Which of the following is NOT a stop codon?",
        options: ["UAA", "UAG", "UGA", "AUG"],
        correctIndex: 3,
        explanation:
          "AUG is the start codon, not a stop codon. The three stop codons are UAA (ochre), UAG (amber), and UGA (opal).",
      },
    ];

    return NextResponse.json({ questions, docTitle });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
