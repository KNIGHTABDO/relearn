"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleGoogleCallback } from "@/lib/google-auth";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function GoogleCallbackPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setErrorMessage(
        error === "access_denied"
          ? "You denied access. Try again from Settings."
          : "Google returned an error: " + error
      );
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMessage("No authorization code received");
      return;
    }

    handleGoogleCallback(code, state || "").then((success) => {
      if (success) {
        setStatus("success");
        setTimeout(() => router.push("/settings"), 1500);
      } else {
        setStatus("error");
        setErrorMessage("Failed to complete authentication. Please try again.");
      }
    });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Connecting your Google account...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Connected! Redirecting to settings...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage || "Something went wrong"}</p>
            <button
              onClick={() => router.push("/settings")}
              className="mt-2 rounded-full bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm"
            >
              Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-purple-500" /></div>}>
      <GoogleCallbackPageInner />
    </Suspense>
  );
}
