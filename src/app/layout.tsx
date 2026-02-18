import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReLearn — AI-Powered Study Platform",
  description:
    "Transform your study materials into interactive learning experiences with AI-powered summaries, tutoring, and flashcards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
