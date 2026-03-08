"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "border-zinc-200 dark:border-zinc-800",
        },
      }}
    />
  );
}

export { toast } from "sonner";
