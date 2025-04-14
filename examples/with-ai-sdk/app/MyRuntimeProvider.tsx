"use client";

import {
  AssistantRuntimeProvider,
  makeAssistantToolUI,
} from "@assistant-ui/react";
import { useVercelUseChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useChat } from "@ai-sdk/react";
import { Tools } from "@/lib/tools-2";
import { assistantUIToolBox } from "@assistant-ui/react/runtimes/core/ThreadRuntimeCore";

export const toolbox = assistantUIToolBox<Tools>();

// const Test = toolbox.getLocationFromUser.getUI({
//   execute: (a) => "test",
//   render: ({ result }) => {
//     console.log("result: ", result);
//     return <div>test</div>;
//   },
// });

const Test = toolbox.weather.getUI({
  execute: (a) => a.location,
  render: ({ result }) => {
    console.log("result: ", result);
    return <div>{result}</div>;
  },
});

// const WTF = makeAssistantToolUI({
//   toolName: "weather",
//   render: ({ result }) => {
//     console.log("result: ", result);
//     return <div>test</div>;
//   },
// });

export function MyRuntimeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chat = useChat({ api: "/api/chat", maxSteps: 5 });

  const runtime = useVercelUseChatRuntime(chat);

  console.log("yurr: ", chat.messages);

  // console.log(
  //   "wtf: ",
  //   toolbox.getLocationFromUser.getUI({
  //     execute: (a) => "test",
  //     render: ({ result }) => {
  //       console.log("result: ", result);
  //       return <div>test</div>;
  //     },
  //   }),
  // );

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Test />
      {/* <WTF /> */}
      {children}
    </AssistantRuntimeProvider>
  );
}
