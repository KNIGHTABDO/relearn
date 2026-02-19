import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { DatabaseProvider } from "@/components/providers/database-provider";
import { UpdateBanner } from "@/components/update-banner";
import { CommandPalette } from "@/components/ui/command-palette";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('relearn-theme') || 'system';
                  var resolved = theme;
                  if (theme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(resolved);
                  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0a0a0a' : '#ffffff');
                  var lang = localStorage.getItem('relearn-language') || 'en';
                  document.documentElement.lang = lang;
                  document.documentElement.dir = ['ar'].includes(lang) ? 'rtl' : 'ltr';
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <DatabaseProvider>
          <ThemeProvider>
            <I18nProvider>
              <UpdateBanner />
              <CommandPalette />
              {children}
            </I18nProvider>
          </ThemeProvider>
        </DatabaseProvider>
      </body>
    </html>
  );
}
