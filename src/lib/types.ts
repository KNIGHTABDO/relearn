export interface Space {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface Document {
  id: string;
  title: string;
  type: "pdf" | "youtube" | "text" | "recording" | "image" | "docx" | "pptx";
  text: string;
  chunks: string[];
  fileSize?: number;
  pageCount?: number;
  url?: string;
  /** Base64-encoded raw file data (for PDF rendering) */
  fileData?: string;
  createdAt: Date;
  spaceId?: string;
}

export interface FlashcardSet {
  id: string;
  cards: Flashcard[];
  documentId?: string;
  spaceId?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PracticeExam {
  id: string;
  title: string;
  questions: QuizQuestion[];
  spaceId: string;
  timeLimit: number; // minutes
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
