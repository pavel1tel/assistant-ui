import {
  AssistantUITools,
  testFunc,
  ToolsWithout,
} from "@assistant-ui/react/runtimes/core/ThreadRuntimeCore";
import { tool } from "ai";
import fs from "node:fs";
import { z } from "zod";

const aiSDKTools = {
  weather: tool({
    description: "Fetched the current weather in the given location.",
    parameters: z.object({
      location: z.string(),
    }),
    execute: async ({ location }) => {
      // Generate a random temperature between 0°C and 35°C

      fs.readFileSync("/");
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

type without = ToolsWithout<typeof aiSDKTools>;

const a = testFunc<typeof aiSDKTools>({
  getLocationFromUser: {
    execute: async (args) => `args + ${args}`,
  },
});

a({
  toolName: "getLocationFromUser",
  result: (a) => {
    console.log(a);
  },
});

// type t = (typeof a)["getLocationFromUser"]["execute"];

// const yur = a.get("weather");

// yur.execute({ location: "test" });
