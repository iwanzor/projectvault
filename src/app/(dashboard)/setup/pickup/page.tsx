"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PickupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/setup/ohp-items");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-zinc-500">Redirecting to OHP Items...</p>
    </div>
  );
}
