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

type VercelToolShim = {
  description?: string;
  parameters?: z.ZodTypeAny;
  // MARK: Does the following two parameters need to be improved?
  execute?: unknown;
  experimental_toToolResultContent?: unknown;
};

type ToolType = VercelToolShim;

// TODO: Add langchain / langgraph support.
// type LangChainToolShim = {}

export type AssistantUITools = Record<string, VercelToolShim>;

type ToolParameters = z.ZodTypeAny;
type inferParameters<PARAMETERS extends ToolParameters> =
  PARAMETERS extends z.ZodTypeAny ? z.infer<PARAMETERS> : never;

export type ClientSideTools<T extends AssistantUITools> = {
  [K in keyof T as T[K]["execute"] extends undefined ? K : never]: {
    execute: (
      args: inferParameters<
        T[K]["parameters"] extends z.ZodTypeAny
          ? T[K]["parameters"]
          : z.ZodNever
      >,
    ) => PromiseLike<unknown>;
  };
};

// Define the shape of a tool with getUI
type ToolWithUI = {
  getUI: () => null;
};

// Define the shape of a tool that takes a user-defined function
type ToolWithUserFunction<A extends ToolType> = {
  execute: <
    P extends (
      args: inferParameters<
        A["parameters"] extends z.ZodTypeAny ? A["parameters"] : z.ZodNever
      >,
    ) => unknown,
  >(
    userFn: P,
  ) => {
    getUI: () => (args: { result: ReturnType<P> }) => React.ReactNode;
  };
};

// Type for the processed tools
type ProcessedTools<T extends AssistantUITools> = {
  [K in keyof T]: T[K]["execute"] extends undefined
    ? ToolWithUserFunction<T[K]>
    : ToolWithUI;
};

export function assistantUIToolbox<T extends AssistantUITools>(
  args: ClientSideTools<T>,
): ProcessedTools<T> {
  const processedTools = Object.entries(args).reduce((acc, [key, tool]) => {
    const t = tool as ToolType;
    if ("execute" in t) {
      acc[key as keyof T] = {
        getUI: () => null,
      } as ProcessedTools<T>[keyof T];
    } else {
      acc[key as keyof T] = {
        execute: (userFn) => ({
          getUI: () => (args: ReturnType<typeof userFn>) => (
            <>{JSON.stringify(args)}</>
          ),
        }),
      } as ProcessedTools<T>[keyof T];
    }
    return acc;
  }, {} as ProcessedTools<T>);

  return processedTools;
}
