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

export type AssistantUITools = Record<string, VercelToolShim>;

type ToolParameters = z.ZodTypeAny;
export type PARAMETERS = z.ZodTypeAny;
type inferParameters<PARAMETERS extends ToolParameters> =
  PARAMETERS extends z.ZodTypeAny ? z.infer<PARAMETERS> : never;

export type ClientSideTools<T extends AssistantUITools> = {
  [K in keyof T as T[K]["execute"] extends undefined
    ? K
    : never]: T[K]["execute"] extends undefined
    ? {
        execute: (
          args: inferParameters<
            T[K]["parameters"] extends z.ZodTypeAny
              ? T[K]["parameters"]
              : z.ZodTypeAny
          >,
        ) => PromiseLike<unknown>;
      }
    : never;
};

export type ToolChecker<
  AUI extends AssistantUITools,
  C extends ClientSideTools<AUI>,
> = {
  // [K in keyof T as T[K]["execute"] extends undefined
  //   ? K
  //   : never]: T[K]["execute"] extends undefined
  //   ? {
  //       execute: (
  //         args: inferParameters<
  //           T[K]["parameters"] extends z.ZodTypeAny
  //             ? T[K]["parameters"]
  //             : z.ZodTypeAny
  //         >,
  //       ) => PromiseLike<unknown>;
  //     }
  //   : never;
  [K in keyof C]: C[K]["execute"] extends undefined ? K : never;
};

// Define the shape of a tool with getUI
type ToolWithUI<RESULT> = {
  // getUI: () => (args: { result: ReturnType<P> }) => React.ReactNode;
  getUI: (
    args: GetUIARgs2<RESULT>,
  ) => (args: { result: RESULT }) => React.ReactNode;
};

type GetUIARgs2<RESULT> = {
  render: (args: { result: RESULT }) => React.ReactNode;
};

type GetUIARgs<P extends PARAMETERS, RESULT = any> = {
  execute: (args: inferParameters<P>) => PromiseLike<RESULT>;
  render: (args: { result: RESULT }) => React.ReactNode;
};

// Define the shape of a tool that takes a user-defined function
type ToolWithUserFunction<P extends PARAMETERS> = {
  getUI<RESULT = any>(
    args: GetUIARgs<P, RESULT>,
  ): (args: { result: RESULT }) => React.ReactNode;
};

// // Type for the processed tools
// type ProcessedTools<
//   T extends AssistantUITools,
//   C extends ClientSideTools<T>,
// > = {
//   [K in keyof T]: T[K]["execute"] extends undefined
//     ? ToolChecker<T, C>[K] extends undefined
//       ? ToolWithUserFunction<
//           T[K]["parameters"] extends z.ZodTypeAny
//             ? T[K]["parameters"]
//             : z.ZodNever
//         >
//       : string
//     : ToolWithUI<Awaited<ReturnType<NonNullable<T[K]["execute"]>>>>;
// };

type ProcessedTools<
  T extends AssistantUITools,
  C extends ClientSideTools<T>,
> = {
  [K in keyof T]: T[K]["execute"] extends undefined
    ? K extends keyof C
      ? C[K]["execute"] extends undefined
        ? ToolWithUserFunction<
            T[K]["parameters"] extends z.ZodTypeAny
              ? T[K]["parameters"]
              : z.ZodString
          >
        : ToolWithUI<Awaited<ReturnType<NonNullable<T[K]["execute"]>>>>
      : ToolWithUserFunction<
          T[K]["parameters"] extends z.ZodTypeAny
            ? T[K]["parameters"]
            : z.ZodString
        >
    : ToolWithUI<Awaited<ReturnType<NonNullable<T[K]["execute"]>>>>;
};

export function assistantUIToolbox<
  T extends AssistantUITools,
  C extends ClientSideTools<T> = ClientSideTools<T>,
>(args: C | undefined) {
  const processedTools = Object.entries(args || {}).reduce(
    (acc, [key, tool]) => {
      const t = tool as ToolType;
      if ("execute" in t) {
        acc[key as keyof T] = {
          getUI<RESULT = string>(
            args: GetUIARgs2<RESULT>,
          ): (args: { result: RESULT }) => React.ReactNode {
            return args.render;
          },
          // };
          //   // getUI: () => (args: any) => <>{JSON.stringify(args)}</>,
        } as ProcessedTools<T, C>[keyof T];
      } else {
        acc[key as keyof T] = {
          getUI<TArgs extends PARAMETERS, RESULT = any>(
            args: GetUIARgs<TArgs, RESULT>,
          ): (args: { result: RESULT }) => React.ReactNode {
            return args.render;
          },
        } as ProcessedTools<T, C>[keyof T];
      }
      return acc;
    },
    {} as ProcessedTools<T, C>,
  );

  return processedTools;
}

// type AUITBKeys<T> = keyof T;

type SafeParameters<T> = T extends z.ZodTypeAny ? T : z.ZodNever;

// type CSTools<T extends AssistantUITools> = {
//   [K in keyof T]: T[K]["execute"] extends undefined
//     ? // ? {
//       //     execute: (
//       //       args: inferParameters<SafeParameters<T[K]["parameters"]>>,
//       //     ) => PromiseLike<unknown>;
//       //   }
//       true
//     : // ? T[K]
//       never;
// };

// type CSTools2<T extends CSTools<AssistantUITools>> = {
//   [K in keyof T as T[K]["execute"] extends undefined ? K : never]: T[K];
// };
// Returns a new set of AssistantUITools with more or less executes

type KeysWithNeed<T extends AssistantUITools> = {
  [K in keyof T]: T[K]["execute"] extends undefined ? K : never;
}[keyof T];

type KeysWithoutNeed<T extends AssistantUITools> = {
  [K in keyof T]: T[K]["execute"] extends undefined ? never : K;
}[keyof T];

type ClientSideToolInitialArgs<
  T extends AssistantUITools,
  Keys extends KeysWithNeed<T>,
  SlimmedTools extends Pick<T, Keys>,
> = {
  [Key in keyof SlimmedTools]: {
    execute?: (
      args: inferParameters<SafeParameters<SlimmedTools[Key]["parameters"]>>,
    ) => PromiseLike<unknown>;
  };
};

/*
iterate through the tools, find the ones that don't have an execute function.
give an option to add execute in args, if they do then return a new set of AssistantUITools.
Then handle the logic inside the function. If an execute tool is there then user just defines 
render when they do getUI({toolName: "test"}). The tool name does the picking for the rest.
*/

// type GetUIArgs<
//   T extends AssistantUITools,
//   Key extends keyof T = string,
//   Execute = T[Key]["execute"],
//   Result = unknown,
// > = {
//   toolName: Key;
// } & (Execute extends (...args: any) => PromiseLike<unknown>
//   ? {
//       render: (args: {
//         result: Awaited<ReturnType<Execute>>;
//       }) => React.ReactNode;
//     }
//   : {
//       execute: (
//         args: inferParameters<SafeParameters<T[Key]["parameters"]>>,
//       ) => PromiseLike<Result>;
//       render: (args: { result: Result }) => React.ReactNode;
//     });

type InitialArgs<T extends AssistantUITools, Key extends keyof T> = {
  toolName: Key;
};

// declare function getUI<
//   T extends AssistantUITools,
//   Key extends keyof T = string,
// >(args: InitialArgs<T, Key>): React.ReactNode;

// force to string
// type Stringify<T extends AssistantUITools> = {
//   [K in keyof T as string]: T[K];
// };

type BaseArgs<Key> = {
  toolName: Key;
  execute: (...args: any) => PromiseLike<unknown>;
};

declare function prepGetUI<
  T extends AssistantUITools,
  Key extends keyof T = keyof T,
  Tool extends T[Key] = T[Key],
>(
  args: BaseArgs<Key>,
): {
  toolName: Key;
  // execute: Tool["execute"];
};

// do not erase below line

// type GetUI<
//   T extends AssistantUITools,
//   Key extends keyof T = keyof T,
//   // StringKey extends string = Key extends string ? Key : never,
// > = (
//   args: BaseArgs<Key> & {
//     execute: T[Key]["execute"];
//   },
// ) => React.ReactNode;

type GetParameters<
  T extends AssistantUITools,
  Key extends keyof T,
> = T[Key]["parameters"];

type GetExecute<
  T extends AssistantUITools,
  Key extends keyof T,
> = T[Key]["execute"];

type GetUIArgs<T extends AssistantUITools, ToolName extends keyof T> = {
  toolName: ToolName;
} & {
  parameters: GetParameters<T, ToolName>;
};

export function assistantUIToolbox2<
  T extends AssistantUITools,
  Args = Partial<
    ClientSideToolInitialArgs<T, KeysWithNeed<T>, Pick<T, KeysWithNeed<T>>>
  >,
>(args: Args) {
  // return { getUI: getUI<T> };
  // const getUI = ({
  //   toolName
  // }: {
  //   toolName: string;
  // }) => {
  //   if (args[toolName].execute) {
  //     return args[toolName].getUI({
  //       toolName,
  //     });
  //   }
  // }

  type ArgsKeysWithExecute<A> = {
    [Key in keyof A]: A[Key] extends undefined ? never : A[Key];
  }[keyof A];

  type CorrectRender<Key, A> = Key extends keyof KeysWithoutNeed<T>
    ? "execute on initial"
    : Key extends keyof ArgsKeysWithExecute<A>
      ? "execute on args"
      : "neither";

  const getUI = <
    ToolName extends KeysWithoutNeed<T> | keyof Args,
    // Execute,
    // Result,
    // >(test: ToolName): T[ToolName]["parameters"];
  >(args: {
    toolName: ToolName;
    test: CorrectRender<ToolName, typeof args>;
    render: (args: {
      result: T[ToolName]["execute"] extends (...args: any) => PromiseLike<any>
        ? Awaited<ReturnType<T[ToolName]["execute"]>>
        : never;
    }) => React.ReactNode;
  }) => {
    return args.render;
  };
  const getUI2 = <
    ToolName extends keyof T,
    // Execute,
    // Result,
    // >(test: ToolName): T[ToolName]["parameters"];
  >(args: {
    toolName: ToolName;
    render: (args: {
      result: T[ToolName]["execute"] extends (...args: any) => PromiseLike<any>
        ? Awaited<ReturnType<T[ToolName]["execute"]>>
        : never;
    }) => React.ReactNode;
  }) => {
    return args.render;
  };

  return { getUI: getUI };
}

// Use Pick for getting stuff out of AssistantUITools

// type Fruit = {
//   apple: "red" | "green";
//   banana: "yellow" | "brown";
// };

// function fruitSweetness<T extends keyof Fruit>(args: {
//   fruit: T;
//   color: Fruit[T];
// }) {
//   // Implementation goes here
//   console.log(`The ${args.fruit} is ${args.color} and is sweet!`);
// }

// fruitSweetness({
//   fruit: "apple",
//   color: "red",
// });
