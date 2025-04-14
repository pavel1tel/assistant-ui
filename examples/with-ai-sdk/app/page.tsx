"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { useAssistantRuntime } from "@assistant-ui/react";

export default function Home() {
  const r = useAssistantRuntime();

  console.log(r.thread);
  return (
    <main className="h-full">
      <Thread />
    </main>
  );
}
