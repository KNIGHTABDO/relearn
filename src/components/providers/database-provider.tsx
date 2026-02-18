"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { initDatabase, isDesktopMode } from "@/lib/database";

interface DatabaseContextValue {
  ready: boolean;
  isDesktop: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue>({ ready: false, isDesktop: false });

export function useDatabaseContext() {
  return useContext(DatabaseContext);
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => {
      setReady(true);
    });
  }, []);

  return (
    <DatabaseContext.Provider value={{ ready, isDesktop: isDesktopMode() }}>
      {children}
    </DatabaseContext.Provider>
  );
}
