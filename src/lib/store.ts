import { Space, Document } from "./types";

class AppStore {
  private spaces: Map<string, Space> = new Map();
  private documents: Map<string, Document> = new Map();

  constructor() {
    // Seed with demo data
    this.seedDemoData();
  }

  private seedDemoData() {
    const demoSpaces: Space[] = [
      {
        id: "space-bio",
        name: "Biology 101",
        description: "Introduction to Molecular Biology",
        color: "#10B981",
        icon: "🧬",
        documents: [],
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-02-18"),
        tags: ["biology", "science", "exam-prep"],
      },
      {
        id: "space-cs",
        name: "CS50",
        description: "Introduction to Computer Science",
        color: "#3B82F6",
        icon: "💻",
        documents: [],
        createdAt: new Date("2026-01-20"),
        updatedAt: new Date("2026-02-17"),
        tags: ["computer science", "programming"],
      },
      {
        id: "space-psych",
        name: "Psychology",
        description: "Cognitive Psychology & Neuroscience",
        color: "#A855F7",
        icon: "🧠",
        documents: [],
        createdAt: new Date("2026-02-01"),
        updatedAt: new Date("2026-02-16"),
        tags: ["psychology", "neuroscience"],
      },
    ];

    const demoDocuments: Document[] = [
      {
        id: "doc-genetics",
        title: "The Genetic Code & Translation",
        type: "pdf",
        text: "The genetic code is the set of rules by which information encoded within genetic material (DNA or RNA sequences) is translated into proteins by living cells. Translation is accomplished by the ribosome, which links proteinogenic amino acids in an order specified by messenger RNA (mRNA). The genetic code is highly similar among all organisms and can be expressed in a simple table with 64 entries. The code defines how codons — sequences of three nucleotides — specify which amino acid will be added next during protein synthesis. With some exceptions, a three-nucleotide codon in a nucleic acid sequence specifies a single amino acid. The vast majority of genes are encoded with a single scheme. That scheme is often referred to as the canonical or standard genetic code.",
        chunks: [],
        fileSize: 2400000,
        pageCount: 19,
        createdAt: new Date("2026-02-10"),
        spaceId: "space-bio",
      },
      {
        id: "doc-cell",
        title: "Cell Division & Mitosis",
        type: "pdf",
        text: "Cell division is the process by which a parent cell divides into two daughter cells. Cell division usually occurs as part of a larger cell cycle in which the cell grows and replicates its chromosome(s) before dividing. In eukaryotes, there are two distinct types of cell division: a vegetative division (mitosis), producing daughter cells genetically identical to the parent cell, and a cell division that produces haploid gametes for sexual reproduction (meiosis), reducing the number of chromosomes from two of each type in the diploid parent cell to one of each type in the daughter cells.",
        chunks: [],
        fileSize: 1800000,
        pageCount: 14,
        createdAt: new Date("2026-02-12"),
        spaceId: "space-bio",
      },
      {
        id: "doc-algo",
        title: "Algorithms & Data Structures",
        type: "pdf",
        text: "An algorithm is a finite sequence of well-defined instructions, typically used to solve a class of specific problems or to perform a computation. Algorithms are used as specifications for performing calculations and data processing. By making use of artificial intelligence, an algorithm can perform automated deductions and use mathematical and logical tests to divert the code execution through various routes. Data structures provide a means to manage large amounts of data efficiently for uses such as large databases and internet indexing services.",
        chunks: [],
        fileSize: 3200000,
        pageCount: 28,
        createdAt: new Date("2026-02-08"),
        spaceId: "space-cs",
      },
      {
        id: "doc-memory",
        title: "Human Memory Systems",
        type: "pdf",
        text: "Human memory involves the ability to both preserve and recover information we have learned or experienced. Memory is vital to experiences, it is the retention of information over time for the purpose of influencing future action. The three main processes involved in human memory are encoding, storage, and retrieval. There are several different types of memory: sensory memory, short-term memory, working memory, and long-term memory, each of which has distinct characteristics and plays a unique role in cognitive function.",
        chunks: [],
        fileSize: 1500000,
        pageCount: 22,
        createdAt: new Date("2026-02-14"),
        spaceId: "space-psych",
      },
    ];

    // Chunk documents
    demoDocuments.forEach((doc) => {
      doc.chunks = this.chunkText(doc.text);
    });

    // Store everything
    demoSpaces.forEach((s) => this.spaces.set(s.id, s));
    demoDocuments.forEach((d) => {
      this.documents.set(d.id, d);
      const space = this.spaces.get(d.spaceId || "");
      if (space) space.documents.push(d);
    });
  }

  chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      chunks.push(text.slice(start, start + chunkSize));
      start += chunkSize - overlap;
    }
    return chunks;
  }

  generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  // Spaces
  getSpaces(): Space[] {
    return Array.from(this.spaces.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  getSpace(id: string): Space | undefined {
    return this.spaces.get(id);
  }

  createSpace(name: string, description?: string, color?: string, icon?: string, tags?: string[]): Space {
    const space: Space = {
      id: "space-" + this.generateId(),
      name,
      description: description || "",
      color: color || "#3B82F6",
      icon: icon || "📚",
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: tags || [],
    };
    this.spaces.set(space.id, space);
    return space;
  }

  updateSpace(id: string, updates: Partial<Space>): Space | undefined {
    const space = this.spaces.get(id);
    if (!space) return undefined;
    Object.assign(space, updates, { updatedAt: new Date() });
    return space;
  }

  deleteSpace(id: string): boolean {
    const space = this.spaces.get(id);
    if (!space) return false;
    space.documents.forEach((d) => this.documents.delete(d.id));
    return this.spaces.delete(id);
  }

  // Documents
  getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  addDocument(doc: Omit<Document, "chunks"> & { chunks?: string[] }): Document {
    const fullDoc: Document = {
      ...doc,
      chunks: doc.chunks || this.chunkText(doc.text),
    };
    this.documents.set(fullDoc.id, fullDoc);

    if (fullDoc.spaceId) {
      const space = this.spaces.get(fullDoc.spaceId);
      if (space) {
        space.documents.push(fullDoc);
        space.updatedAt = new Date();
      }
    }
    return fullDoc;
  }

  removeDocument(id: string): boolean {
    const doc = this.documents.get(id);
    if (!doc) return false;
    if (doc.spaceId) {
      const space = this.spaces.get(doc.spaceId);
      if (space) {
        space.documents = space.documents.filter((d) => d.id !== id);
        space.updatedAt = new Date();
      }
    }
    return this.documents.delete(id);
  }

  // Cross-document context for space-level chat / exams
  getSpaceContext(spaceId: string): string {
    const space = this.spaces.get(spaceId);
    if (!space) return "";
    return space.documents
      .map((d) => `--- ${d.title} ---\n${d.text}`)
      .join("\n\n");
  }

  getSpaceChunks(spaceId: string): string[] {
    const space = this.spaces.get(spaceId);
    if (!space) return [];
    return space.documents.flatMap((d) => d.chunks);
  }
}

// Singleton
const globalStore = (globalThis as any).__appStore || new AppStore();
(globalThis as any).__appStore = globalStore;

export const store = globalStore;
