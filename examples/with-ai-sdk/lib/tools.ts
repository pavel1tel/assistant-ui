import {
  assistantUIToolbox,
  AssistantUITools,
  ClientSideTools,
} from "@assistant-ui/react/runtimes/core/ThreadRuntimeCore";
import { tool } from "ai";
import fs from "node:fs";
import { z } from "zod";

const wtf = tool({
  description: "Fetched the current weather in the given location.",
  parameters: z.object({
    location: z.string(),
  }),
  // execute: async ({ location }) => {
  //   // Generate a random temperature between 0°C and 35°C

  //   fs.readFileSync("/");
  //   console.log(location);
  //   const tempCelsius = Math.random() * 35;
  //   return Number(tempCelsius.toFixed(1)); // Return with 1 decimal place
  // },
});

type a = typeof wtf;

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
    parameters: z.string(),
  }),
} satisfies AssistantUITools;

type ClientSide = ClientSideTools<typeof aiSDKTools>;

// const obj ClientSide

export type Tools = typeof aiSDKTools;

const toolboxs = assistantUIToolbox<Tools>({
  getLocationFromUser: {
    execute: async (arg) => arg,
  },
});

// optional helper functions if you have mixed tool calls?

// nice to have, onToolInvocationComplete as a middleware back from the tool call before it get's rendered.
// ( save stuff, make other requests, etc )

/*
 client side .execute means no addResult
 client side no .execute means addResult.
*/
