import { z } from "zod";
import { ModelContext } from "../../model-context";
import { AppendMessage, ThreadMessage } from "../../types";
import { RunConfig } from "../../types/AssistantTypes";
import type { Unsubscribe } from "../../types/Unsubscribe";
import { SpeechSynthesisAdapter } from "../adapters/speech/SpeechAdapterTypes";
import { ChatModelRunOptions, ChatModelRunResult } from "../local";
import { ExportedMessageRepository } from "../utils/MessageRepository";
import {
  ComposerRuntimeCore,
  ThreadComposerRuntimeCore,
} from "./ComposerRuntimeCore";

export type RuntimeCapabilities = {
  readonly switchToBranch: boolean;
  readonly edit: boolean;
  readonly reload: boolean;
  readonly cancel: boolean;
  readonly unstable_copy: boolean;
  readonly speech: boolean;
  readonly attachments: boolean;
  readonly feedback: boolean;
};

// Mark
export type AddToolResultOptions = {
  messageId: string;
  toolName: string;
  toolCallId: string;
  result: any;
};

export type SubmitFeedbackOptions = {
  messageId: string;
  type: "negative" | "positive";
};

export type ThreadSuggestion = {
  prompt: string;
};

export type SpeechState = {
  readonly messageId: string;
  readonly status: SpeechSynthesisAdapter.Status;
};

export type SubmittedFeedback = {
  readonly type: "negative" | "positive";
};

export type ThreadRuntimeEventType =
  | "run-start"
  | "run-end"
  | "initialize"
  | "model-context-update";

export type StartRunConfig = {
  parentId: string | null;
  sourceId: string | null;
  runConfig: RunConfig;
};

export type ResumeRunConfig = StartRunConfig & {
  stream: (
    options: ChatModelRunOptions,
  ) => AsyncGenerator<ChatModelRunResult, void, unknown>;
};

export type ThreadRuntimeCore = Readonly<{
  getMessageById: (messageId: string) =>
    | {
        parentId: string | null;
        message: ThreadMessage;
      }
    | undefined;

  getBranches: (messageId: string) => readonly string[];
  switchToBranch: (branchId: string) => void;

  append: (message: AppendMessage) => void;
  startRun: (config: StartRunConfig) => void;
  resumeRun: (config: ResumeRunConfig) => void;
  cancelRun: () => void;

  addToolResult: (options: AddToolResultOptions) => void;

  speak: (messageId: string) => void;
  stopSpeaking: () => void;

  getSubmittedFeedback: (messageId: string) => SubmittedFeedback | undefined;
  submitFeedback: (feedback: SubmitFeedbackOptions) => void;

  getModelContext: () => ModelContext;

  composer: ThreadComposerRuntimeCore;
  getEditComposer: (messageId: string) => ComposerRuntimeCore | undefined;
  beginEdit: (messageId: string) => void;

  speech: SpeechState | undefined;

  capabilities: Readonly<RuntimeCapabilities>;
  isDisabled: boolean;
  messages: readonly ThreadMessage[];
  suggestions: readonly ThreadSuggestion[];

  // TODO deprecate for a more elegant solution
  // /**
  //  * @deprecated This field is deprecated and will be removed in 0.8.0.
  //  * Please migrate to using `AssistantRuntimeCore.Provider` instead.
  //  */
  extras: unknown;

  subscribe: (callback: () => void) => Unsubscribe;

  import(repository: ExportedMessageRepository): void;
  export(): ExportedMessageRepository;

  unstable_on(event: ThreadRuntimeEventType, callback: () => void): Unsubscribe;
}>;

type VercelToolShim =
  | {
      description?: string;
      parameters?: z.ZodTypeAny;
      // MARK: Does the following two parameters need to be improved?
      execute?: (...args: any) => PromiseLike<unknown>;
      experimental_toToolResultContent?: unknown;
    }
  | {
      description?: string;
      parameters?: z.ZodTypeAny;
      // MARK: Does the following two parameters need to be improved?
      // execute?: undefined;
      execute?: undefined;
      experimental_toToolResultContent?: unknown;
    };

type ToolType = VercelToolShim;

// TODO: Add langchain / langgraph support.
// type LangChainToolShim = {}

// type ToolParameters = z.ZodTypeAny | Schema<any>;
// type inferParameters<PARAMETERS extends ToolParameters> =
//   PARAMETERS extends Schema<any>
//     ? PARAMETERS["_type"]
//     : PARAMETERS extends z.ZodTypeAny
//       ? z.infer<PARAMETERS>
//       : never;
interface ToolExecutionOptions {
  /**
   * The ID of the tool call. You can use it e.g. when sending tool-call related information with stream data.
   */
  toolCallId: string;
  /**
   * Messages that were sent to the language model to initiate the response that contained the tool call.
   * The messages **do not** include the system prompt nor the assistant response that contained the tool call.
   */
  messages: any[];
  /**
   * An optional abort signal that indicates that the overall operation should be aborted.
   */
  abortSignal?: AbortSignal;
}
/**
A tool contains the description and the schema of the input that the tool expects.
This enables the language model to generate the input.

The tool can also contain an optional execute function for the actual execution function of the tool.
 */
type Tool<PARAMETERS extends ToolParameters = any, RESULT = any> = {
  /**
  The schema of the input that the tool expects. The language model will use this to generate the input.
  It is also used to validate the output of the language model.
  Use descriptions to make the input understandable for the language model.
     */
  parameters: PARAMETERS;
  /**
  An optional description of what the tool does.
  Will be used by the language model to decide whether to use the tool.
  Not used for provider-defined tools.
     */
  description?: string;
  /**
  Optional conversion function that maps the tool result to multi-part tool content for LLMs.
     */
  experimental_toToolResultContent?: (result: RESULT) => any[];
  /**
  An async function that is called with the arguments from the tool call and produces a result.
  If not provided, the tool will not be executed automatically.
  
  @args is the input of the tool call.
  @options.abortSignal is a signal that can be used to abort the tool call.
     */
  execute?: (
    args: inferParameters<PARAMETERS>,
    options: ToolExecutionOptions,
  ) => PromiseLike<RESULT>;
} & (
  | {
      /**
Function tool.
     */
      type?: undefined | "function";
    }
  | {
      /**
Provider-defined tool.
     */
      type: "provider-defined";
      /**
The ID of the tool. Should follow the format `<provider-name>.<tool-name>`.
     */
      id: `${string}.${string}`;
      /**
The arguments for configuring the tool. Must match the expected arguments defined by the provider for this tool.
     */
      args: Record<string, unknown>;
    }
);

/**
Helper function for inferring the execute args of a tool.
 */
declare function tool<PARAMETERS extends ToolParameters, RESULT>(
  tool: Tool<PARAMETERS, RESULT> & {
    execute: (
      args: inferParameters<PARAMETERS>,
      options: ToolExecutionOptions,
    ) => PromiseLike<RESULT>;
  },
): Tool<PARAMETERS, RESULT> & {
  execute: (
    args: inferParameters<PARAMETERS>,
    options: ToolExecutionOptions,
  ) => PromiseLike<RESULT>;
};
declare function tool<PARAMETERS extends ToolParameters, RESULT>(
  tool: Tool<PARAMETERS, RESULT> & {
    execute?: undefined;
  },
): Tool<PARAMETERS, RESULT> & {
  execute: undefined;
};

export type ToolName = string;
export type AssistantUITools = Record<ToolName, Tool<any, any>>;

type ToolParameters = z.ZodTypeAny;
export type PARAMETERS = z.ZodTypeAny;
type inferParameters<PARAMETERS extends ToolParameters> =
  PARAMETERS extends z.ZodTypeAny ? z.infer<PARAMETERS> : never;

// type ToolKeysWithoutExecute<T extends AssistantUITools> = {
//   [K in keyof T]: T[K] extends { execute: undefined } ? K : never;
// }[keyof T];

// type Temp<Args extends z.ZodTypeAny, Result = any> = {
//   args: Args;
//   result: Result;
// };

// export type ToolsWithout<T extends AssistantUITools> = {
//   [K in keyof T]: T[K] extends {
//     execute: <Result>(
//       ...args: Temp<T[K]["parameters"], Result>["args"]
//     ) => PromiseLike<Result>;
//   }
//     ? T[K]
//     : never;
// };

export type ToolsWithout<T extends AssistantUITools> = {
  [K in keyof T]: T[K] extends { execute: undefined } ? T[K] : never;
};

// type Args<ToolName, Execute> = {
//   toolName: ToolName;
//   execute: Execute;
//   // render?: (args: { result: Awaited<ReturnType<Execute>> }) => React.ReactNode;
// };

// type AllArgs<
//   A extends AssistantUITools,
//   B extends keyof A,
//   C extends Pick<A, B> = Pick<A, B>,
// > = {
//   [K in keyof C]: C[K] extends { execute: undefined }
//     ? {
//         execute: (
//           ...args: inferParameters<C[K]["parameters"]>
//         ) => PromiseLike<any>;
//       }
//     : never;
// };

type AllArgs<
  A extends AssistantUITools,
  B extends keyof A,
  C extends Pick<A, B> = Pick<A, keyof A>,
> = {
  [K in keyof C as C[K] extends { execute: undefined } ? K : never]: {
    execute: (...args: inferParameters<C[K]["parameters"]>) => PromiseLike<any>;
  };
};

type AllArgs2<
  A extends AssistantUITools,
  B extends keyof A,
  Z extends AllArgs<A, B>,
> = {
  // [K in keyof C as C[K] extends { execute: undefined } ? K : never]: {
  [K in keyof Z]: {
    execute: Z[K]["execute"];
  };
};

type OtherArgs<A extends AssistantUITools> = {
  [K in keyof A]: A[K] extends { execute: undefined } ? never : A[K];
};

// type WtfArgs<All extends AssistantUITools, Key extends keyof All> = {
//   toolName: Key;
//   render: (args: {
//     result: Awaited<ReturnType<Pick<All, Key>>>;
//   }) => React.ReactNode;
// };

// type WtfArgs<All extends AssistantUITools> = {
//   [Key in keyof All]: All[Key] extends {
//     execute: (...args: any) => PromiseLike<any>;
//   }
//     ? {
//         toolName: Key;
//         render: (args: {
//           result: Awaited<ReturnType<All[Key]["execute"]>>;
//         }) => React.ReactNode;
//       }
//     : never;
// };

// type Func<All extends AssistantUITools> = (a: Partial<WtfArgs<All>>) => void;

type CustomReturnType<T> = T extends {
  execute: (...args: any) => PromiseLike<infer R>;
}
  ? R
  : never;

// type FuncArgs<All extends AssistantUITools, Args extends string> = {
//   toolName: Args;
//   result: (a: {
//     result: Awaited<CustomReturnType<All["weather"]["execute"]>>;
//   }) => void;
// };

// type FuncArgs<All extends AssistantUITools> = {
//   [K in keyof All]: {
//     toolName: K;
//     result: (a: {
//       result: Awaited<CustomReturnType<All[K]["execute"]>>;
//     }) => void;
//   };
//   //   toolName: Args;
//   //   result: (a: {
//   //     result: Awaited<CustomReturnType<All["weather"]["execute"]>>;
//   //   }) => void;
// };

type Values<T> = T[keyof T];

type FuncArgs<All extends AssistantUITools> = {
  [K in keyof All]: {
    toolName: K;
    result: (a: {
      result: Awaited<CustomReturnType<All[K]["execute"]>>;
    }) => void;
  };
  //   toolName: Args;
  //   result: (a: {
  //     result: Awaited<CustomReturnType<All["weather"]["execute"]>>;
  //   }) => void;
};

type Func<All extends AssistantUITools> = (
  a: Values<FuncArgs<All>>,
) => FuncArgs<All>;

export const testFunc = <
  // T extends AssistantUITools,
  // B extends keyof ToolsWithout<T> = keyof ToolsWithout<T>,
  T extends AssistantUITools,
>() =>
  // : Func<T & ToolsWithout<T>>
  {
    // type A = typeof a;
    // return a as unknown as ToolsWithout<T>[A];
    // return {
    //   get: (c: keyof AllArgs<T, B>) => {
    //     return a[c];
    //   },
    // };
    // return a;
    // const res = {} as {
    //   [I in keyof AllArgs<T, B>]: AllArgs<T, B>[I];
    // };
    // Object.entries(a).forEach(([key, value]) => {
    //   const k = key as ToolName;
    //   console.log(key, value);
    //   res[k] = value;
    // });
    // return res;
    // return () => {
    //   // console.log(a);
    //   // return a["getLocationFromUser"]["execute"];
    //   // return a;
    // };

    type Sigh<T extends AssistantUITools> = {
      [K in keyof T]: {
        getUI: <A, U>(a: {
          execute: (a: inferParameters<T[K]["parameters"]>) => A;
          render: (a: { result: A }) => U;
        }) => U;
      };
    };

    return new Proxy({} as Sigh<T>, {
      get: (target, prop: string) => {
        return {
          getUI: <A, U>(a: {
            execute: (a: inferParameters<T[typeof prop]["parameters"]>) => A;
            render: (a: { result: A }) => U;
          }) => {
            console.log("test: ", prop, target, a);
          },
        };
      },
    });
  };

// type OkDen<Args extends (...args: any) => any, Result, Additional> = {
//   args: Args;
//   res: (a: ReturnType<Args>) => Result;
//   additional: ReturnType<Result>;
// };

// type tf = "test" | "test2";

// export const test = <Args extends (...args: any) => any, Result, Additional>(
//   a: OkDen<Args, Result, Additional>,
// ): OkDen<Args, Result, Additional> => {
//   return a;
// };

// test({
//   args: () => "test",
//   res: (a) => "lying",
//   additional: 1,
// });

// function chain<T, U, V>(config: {
//   first: () => T;
//   second: (value: T) => U;
//   third: (value: U) => V;
// }): V {
//   const firstResult = config.first(); // type: T
//   const secondResult = config.second(firstResult); // type: U
//   return config.third(secondResult); // type: V
// }

// chain({
//   first: () => "test",
//   second: (a) => 1,
//   third: (a) => a + "test",
// });
