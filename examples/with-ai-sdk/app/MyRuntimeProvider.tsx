"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useChat } from "@ai-sdk/react";
import { ah } from "@/lib/tools-2";

export function MyRuntimeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chat = useChat({ api: "/api/chat" });

  const runtime = useVercelUseChatRuntime(chat);

  console.log(
    "wtf: ",
    ah.getLocationFromUser.getUI({
      execute: (a) => "test",
      render: ({ result }) => {
        console.log("result: ", result);
        return <div>test</div>;
      },
    }),
  );

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
