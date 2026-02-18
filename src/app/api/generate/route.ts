import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { documentId, spaceId, type } = await request.json();

  let docTitle = "Document";
  if (documentId) {
    const doc = store.getDocument(documentId);
    if (doc) docTitle = doc.title;
  }

  if (type === "flashcards") {
    const flashcards = [
      { id: "1", front: "What is the genetic code?", back: "The set of rules by which information encoded in DNA/RNA is translated into proteins by living cells." },
      { id: "2", front: "What is a codon?", back: "A sequence of three nucleotides that specifies a particular amino acid during protein synthesis." },
      { id: "3", front: "What is translation?", back: "The process by which ribosomes synthesize proteins using an mRNA template." },
      { id: "4", front: "How many codons exist?", back: "64 total — 61 coding for amino acids and 3 stop codons (UAA, UAG, UGA)." },
      { id: "5", front: "What is the wobble hypothesis?", back: "The third nucleotide in a codon can form non-standard base pairs, allowing one tRNA to recognize multiple codons." },
      { id: "6", front: "What are the stop codons?", back: "UAA (ochre), UAG (amber), UGA (opal) — signal termination of protein synthesis." },
      { id: "7", front: "What is the start codon?", back: "AUG — codes for methionine and initiates translation." },
      { id: "8", front: "What is tRNA?", back: "Transfer RNA — carries specific amino acids to the ribosome and has an anticodon that pairs with mRNA codons." },
    ];
    return NextResponse.json({ flashcards, docTitle });
  }

  if (type === "quiz") {
    const questions = [
      { id: "1", question: "What is the primary function of mRNA?", options: ["Carries amino acids", "Template for protein synthesis", "Catalyzes peptide bonds", "Energy source"], correctIndex: 1, explanation: "mRNA carries the genetic code to the ribosome as the template for protein synthesis." },
      { id: "2", question: "How many nucleotides make up a codon?", options: ["1", "2", "3", "4"], correctIndex: 2, explanation: "A codon is three consecutive nucleotides specifying an amino acid or stop signal." },
      { id: "3", question: "Which codon is both start codon and methionine?", options: ["UAA", "AUG", "UGA", "GCA"], correctIndex: 1, explanation: "AUG initiates translation and codes for methionine." },
      { id: "4", question: "What does the wobble hypothesis explain?", options: ["Semi-conservative replication", "One tRNA recognizing multiple codons", "Protein folding", "Gene regulation"], correctIndex: 1, explanation: "The wobble hypothesis explains flexible base pairing at the third codon position." },
      { id: "5", question: "Which is NOT a stop codon?", options: ["UAA", "UAG", "UGA", "AUG"], correctIndex: 3, explanation: "AUG is the start codon. Stop codons are UAA, UAG, UGA." },
    ];
    return NextResponse.json({ questions, docTitle });
  }

  if (type === "summary") {
    return NextResponse.json({
      summary: {
        title: docTitle,
        keyPoints: [
          "The genetic code consists of 64 codons mapping to 20 amino acids and stop signals",
          "Translation is performed by ribosomes reading mRNA templates",
          "The code is nearly universal across all organisms",
          "Wobble base pairing allows flexibility in codon-anticodon recognition",
        ],
        sections: [
          { heading: "The Genetic Code", content: "A set of rules governing the translation of nucleotide sequences into amino acid sequences. The code uses three-letter codons read from mRNA." },
          { heading: "Translation Process", content: "Ribosomes read mRNA codons and recruit matching tRNAs carrying amino acids, building polypeptide chains in the 5' to 3' direction." },
          { heading: "Code Properties", content: "The genetic code is degenerate (multiple codons per amino acid), non-overlapping, and read without punctuation in continuous triplets." },
        ],
      },
      docTitle,
    });
  }

  if (type === "chapters") {
    return NextResponse.json({
      chapters: [
        { id: "ch1", title: "Introduction to the Genetic Code", startPage: 1, endPage: 3 },
        { id: "ch2", title: "Codons and Amino Acids", startPage: 4, endPage: 7 },
        { id: "ch3", title: "The Translation Machinery", startPage: 8, endPage: 11 },
        { id: "ch4", title: "Wobble Hypothesis", startPage: 12, endPage: 14 },
        { id: "ch5", title: "Mutations and the Genetic Code", startPage: 15, endPage: 17 },
        { id: "ch6", title: "Summary and Key Concepts", startPage: 18, endPage: 19 },
      ],
      docTitle,
    });
  }

  if (type === "notes") {
    return NextResponse.json({
      notes: [
        { id: "n1", title: "Genetic Code Basics", content: "- 64 codons total\n- 61 code for amino acids\n- 3 are stop codons: UAA, UAG, UGA\n- AUG is the universal start codon", highlight: true },
        { id: "n2", title: "Translation Steps", content: "1. Initiation: ribosome assembles at AUG\n2. Elongation: tRNAs deliver amino acids\n3. Termination: stop codon triggers release" },
        { id: "n3", title: "Key Properties", content: "- Degenerate (redundant)\n- Non-overlapping\n- Nearly universal\n- Read in triplets without gaps" },
      ],
      docTitle,
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
