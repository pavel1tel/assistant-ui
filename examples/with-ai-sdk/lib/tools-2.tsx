import {
  AssistantUITools,
  testFunc,
  ToolsWithout,
} from "@assistant-ui/react/runtimes/core/ThreadRuntimeCore";
import { tool } from "ai";
// import fs from "node:fs";
import { z } from "zod";

const aiSDKTools = {
  weather: tool({
    description: "Fetched the current weather in the given location.",
    parameters: z.object({
      location: z.string(),
    }),
    execute: async ({ location }) => {
      // Generate a random temperature between 0°C and 35°C

      //   fs.readFileSync("/");
      console.log(location);
      const tempCelsius = Math.random() * 35;
      return Number(tempCelsius.toFixed(1)); // Return with 1 decimal place
    },
  }),
  getLocationFromUser: tool({
    description:
      "Asks the user for their location if the user does provide one.",
    parameters: z.array(z.string()),
  }),
  //   test: tool({
  //     description:
  //       "Asks the user for their location if the user does provide one.",
  //     parameters: z.object({
  //       ahhh: z.string(),
  //     }),
  //     execute: undefined,
  //     // execute: async (args) => `args + ${args}`,
  //   }),
} satisfies AssistantUITools;

// type without = ToolsWithout<typeof aiSDKTools>;

// const a = testFunc<typeof aiSDKTools>({
//   getLocationFromUser: {
//     execute: async (args) => `args + ${args}`,
//   },
// });

// const ah = a()["getLocationFromUser"]["execute"];

// // const b = a()["getLocationFromUser"]["execute"]("test");

// // const ah = a()["getLocationFromUser"]["execute"]("test");

// type test = typeof ah;

// // a({
// //   toolName: "getLocationFromUser",
// //   result: (a) => {
// //     console.log(a);
// //   },
// // });

// // type t = (typeof a)["getLocationFromUser"]["execute"];

// // const yur = a.get("weather");

// // yur.execute({ location: "test" });

// function test<T extends AssistantUITools>(a: {
//   [K in keyof T]: {
//     execute: T[K]["execute"];
//   };
// }) {
//   return a;
// }

// const blah = test<typeof aiSDKTools>({
//   getLocationFromUser: {
//     execute: undefined,
//   },
//   weather: {
//     execute: async (args) => 1,
//   },
// });

// // const blah2 = blah.getLocationFromUser.execute("test");

/*

assistantUI<Tools>.define()




*/

type inferParameters<PARAMETERS extends z.ZodTypeAny> =
  PARAMETERS extends z.ZodTypeAny ? z.infer<PARAMETERS> : never;

type Something<U extends z.ZodTypeAny, T = any> = (args: U) => T;

function test<T extends AssistantUITools>(a: {
  [K in keyof T]: T[K]["execute"] extends undefined
    ? {
        execute: Something<inferParameters<T[K]["parameters"]>>;
      }
    : T[K];
}) {
  return a;
}

export const ah = testFunc<typeof aiSDKTools>();

// ah.getLocationFromUser.get({
//   toolName: "getLocationFromUser",
//   execute: async (args) => `args + ${args}`,
//   render: (a) => <div>{a.result}</div>,
// });

// ah.getLocationFromUser

// const ahhh = test<typeof aiSDKTools>({
//   getLocationFromUser: {
//     execute: async (args) => `args + ${args}`,
//   },
// });

// const yur = ahhh["weather"]["execute"];
// yur(
//   { location: "test" },
//   {
//     toolCallId: "test",
//     messages: [],
//     abortSignal: undefined,
//   },
// );
