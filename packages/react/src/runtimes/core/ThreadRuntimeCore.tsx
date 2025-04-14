import { z } from "zod";
import {
  makeAssistantToolUI,
  ModelContext,
  useAssistantToolUI,
} from "../../model-context";
import {
  AppendMessage,
  ThreadMessage,
  ToolCallContentPartComponent,
} from "../../types";
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

// TODO: Add langchain / langgraph support.
// type LangChainToolShim = {}

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

export type ToolName = string;
export type AssistantUITools = Record<ToolName, Tool<any, any>>;

type ToolParameters = z.ZodTypeAny;
export type PARAMETERS = z.ZodTypeAny;
type inferParameters<PARAMETERS extends ToolParameters> =
  PARAMETERS extends z.ZodTypeAny ? z.infer<PARAMETERS> : never;

export const assistantUIToolBox = <T extends AssistantUITools>() => {
  type Sigh<T extends AssistantUITools> = {
    [K in keyof T]: {
      getUI: <A>(a: {
        execute: (a: inferParameters<T[K]["parameters"]>) => A;
        render: (a: { result: A }) => React.ReactNode;
      }) => ReturnType<typeof makeAssistantToolUI>;
    };
  };

  return new Proxy({} as Sigh<T>, {
    get: (target, prop: string) => {
      return {
        getUI: <A, U>(a: {
          execute: (a: inferParameters<T[typeof prop]["parameters"]>) => A;
          // render: (a: { result: A }) => React.ReactNode;
          render: ToolCallContentPartComponent<
            inferParameters<T[typeof prop]["parameters"]>,
            A
          >;
        }) => {
          // // eslint-disable-next-line react-hooks/rules-of-hooks
          // useAssistantToolUI({
          //   toolName: prop,
          //   // render: () => {
          //   //   console.log("test: ", prop, target, a);
          //   //   return a.render;
          //   // },
          //   render: a.render,
          // });

          console.log("test: ", prop, target, a);

          // const Wrapper = ({ children }: { children: React.ReactNode }) => {
          //   return <>{children}</>;
          // };

          // return a.render;

          return makeAssistantToolUI({
            toolName: prop,
            render: a.render,
          });
        },
      };
    },
  });
};
