import {
  assistantUIToolBox,
  AssistantUITools,
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
  // getLocationFromUser: tool({
  //   description:
  //     "Asks the user for their location if the user does provide one.",
  //   parameters: z.array(z.string()),
  // }),
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

export type Tools = typeof aiSDKTools;
export const tools = aiSDKTools;
