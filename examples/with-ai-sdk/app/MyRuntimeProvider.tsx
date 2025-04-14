"use client";

import {
  AssistantRuntimeProvider,
  makeAssistantTool,
  tool,
  useAssistantRuntime,
  // makeAssistantTool,
  // makeAssistantToolUI,
  // tool,
} from "@assistant-ui/react";
import { useVercelUseChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useChat } from "@ai-sdk/react";
import { Tools } from "@/lib/tools-2";
import { assistantUIToolBox } from "@assistant-ui/react/runtimes/core/ThreadRuntimeCore";
// import { z } from "zod";

export const toolbox = assistantUIToolBox<Tools>();

// const Test = toolbox.getLocationFromUser.getUI({
//   execute: (a) => "test",
//   render: ({ result }) => {
//     console.log("result: ", result);
//     return <div>test</div>;
//   },
// });

const Test = toolbox.getLocationFromUser.getTool({
  // execute: async () => {
  //   console.log("execute: ");
  //   return "Mumbai";
  // },
  render: (a) => {
    // console.log("result: ", a.result);
    // console.log("result: ", result);

    // return <div>{a.result}</div>;
    return (
      <button
        onClick={() => {
          a.addResult("Mumbai");
        }}
      >
        Answer Mumbai
      </button>
    );
  },
});

// const getLocation = tool({
//   parameters: z.object({
//     location: z.string(),
//   }),
//   execute: async ({ location }) => {
//     console.log("execute: ", location);
//     return location;
//   },
// });

// const Test = makeAssistantTool({
//   toolName: "weather",
//   parameters: z.object({
//     location: z.string(),
//   }),
//   execute: async ({ location }) => {
//     console.log("execute: ", location);
//     return 100;
//   },
//   render: ({ result }) => {
//     console.log("result: ", result);
//     return <div>{result}</div>;
//   },
// });

// const submitForm = tool({
//   parameters: z.object({
//     email: z.string().email(),
//     name: z.string(),
//   }),
//   execute: async ({ email, name }) => {
//     // Implementation
//     return { success: true };
//   },
// });

// // // Create a tool component
// const SubmitFormTool = makeAssistantTool({
//   toolName: "submitForm",
//   ...submitForm,
// });

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
