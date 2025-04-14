import { tools } from "@/lib/tools-2";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  console.log("tools: ", tools);

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    onError: (error) => {
      console.error("error: ", error);
    },
    // tools: {
    //   weather: tool({
    //     description: "Fetched the current weather in the given location.",
    //     parameters: z.object({
    //       location: z.string(),
    //     }),
    //     execute: async ({ location }) => {
    //       // Generate a random temperature between 0°C and 35°C

    //       //   fs.readFileSync("/");
    //       console.log(location);
    //       const tempCelsius = Math.random() * 35;
    //       return Number(tempCelsius.toFixed(1)); // Return with 1 decimal place
    //     },
    //   }),
    // },
    tools: { ...tools },
  });

  return result.toDataStreamResponse();
}
