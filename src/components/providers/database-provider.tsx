"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { initDatabase, isDesktopMode } from "@/lib/database";
import { AlertTriangle } from "lucide-react";

interface DatabaseContextValue {
  ready: boolean;
  isDesktop: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextValue>({ ready: false, isDesktop: false, error: null });

export function useDatabaseContext() {
  return useContext(DatabaseContext);
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((err) => {
        console.error("[DatabaseProvider] initDatabase failed:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        // Still mark ready so the app doesn't hang — DB features will degrade gracefully
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-dark-bg">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={{ ready, isDesktop: isDesktopMode(), error }}>
      {error && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-red-100 dark:border-red-900/40 bg-white dark:bg-dark-bg px-3 py-2 shadow-md text-xs text-red-600 dark:text-red-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Database init failed — some features may be unavailable</span>
        </div>
      )}
      {children}
    </DatabaseContext.Provider>
  );
}
