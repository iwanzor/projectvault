"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-gray-900">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-center text-sm text-gray-500">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-4 max-w-lg overflow-auto rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
