import { tool } from "ai";
import fs from "node:fs";
import { z } from "zod";

export const readFile = (path: string) => {
  return fs.readFileSync(path, "utf-8");
};

export const test = () => console.log("test");

type Test =
  | {
      description?: string;
      parameters: z.ZodTypeAny;
      execute: unknown;
    }
  | {
      name: string;
      description: string;
      schema: z.ZodTypeAny;
    };

type Test2 = Record<string, Test>;

const t = tool({
  experimental_toToolResultContent: (r) => [],
  description: "test",
  parameters: z.string(),
  execute: async () => null,
});

const a = {
  one: t,
  two: {
    name: "hi!",
    description: "test",
    schema: z.string(),
  },
} satisfies Test2;
