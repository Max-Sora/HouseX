"use client";

import { useRouter } from "next/navigation";

// Back to the previous page, or home when this page was opened directly.
export default function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
    >
      ← Back
    </button>
  );
}
