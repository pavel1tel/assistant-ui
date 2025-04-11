import fs from "node:fs";

export const readFile = (path: string) => {
  return fs.readFileSync(path, "utf-8");
};

export const test = () => console.log("test");
