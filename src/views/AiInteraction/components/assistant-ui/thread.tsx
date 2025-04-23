import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useMessage, // Import useMessage hook
} from "@assistant-ui/react";
import { FC } from "react"; // Removed 'type' as it's used as a value below
import {
  ArrowDownIcon,
  CheckIcon, // Keep CheckIcon
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  SendHorizontalIcon, // Icon for the trigger button
  AudioLinesIcon,
  Volume2Icon, // Icon for read aloud
} from "lucide-react";
import { cn } from "../../../../lib/utils";
import { Button } from "../../../../components/ui/button";
import { MarkdownText } from "./markdown-text";
import { TooltipIconButton } from "./tooltip-icon-button";
import { RecorderState } from "../../hooks/useAiInteraction";
import RecordingIndicator from "../../../../components/RecordingIndicator";
import TranscribingIndicator from "../../../../components/TranscribingIndicator";
import ModelSelectorSheet from "../ModelSelectorSheet";
import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "./attachment";

// Define the type for the new prop function
type PlayAudioForTextFn = (text: string) => Promise<void>;

interface ThreadProps {
  recorderState?: RecorderState;
  isPlayingAudio?: boolean;
  stopAudioPlayback?: () => void;
  playAudioForText?: PlayAudioForTextFn; // Add the new prop
}

export const Thread: FC<ThreadProps> = ({
  recorderState = "idle",
  isPlayingAudio = false,
  stopAudioPlayback = () => {},
  playAudioForText = async () => {}, // Default async no-op
}) => {
  return (
    // Wrap the trigger and define the Sheet content
    <ThreadPrimitive.Root
      className="box-border flex h-full w-full flex-col overflow-hidden rounded-md"
      style={{
        ["--thread-max-width" as string]: "42rem",
      }}
    >
      <ThreadPrimitive.Viewport className="flex h-full w-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit">
        <ThreadWelcome />

        {/* Pass playAudioForText down via render prop */}
        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessage,
            EditComposer: EditComposer,
            AssistantMessage: (props) => (
              <AssistantMessage
                {...props}
                playAudioForText={playAudioForText}
              />
            ),
          }}
        />

        <ThreadPrimitive.If empty={false}>
          <div className="min-h-8 flex-grow" />
        </ThreadPrimitive.If>

        <div className="sticky bottom-0 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-lg bg-inherit pb-2">
          <ThreadScrollToBottom />

          {/* Model Selector, Stop Button, and Composer Area */}
          <div className="flex flex-col items-center w-full max-w-[var(--thread-max-width)] gap-2">
            {/* Recording/Transcribing Indicators */}
            {recorderState === "recording" && <RecordingIndicator />}
            {recorderState === "transcribing" && <TranscribingIndicator />}

            {/* Idle State: Show Model Selector, Stop Button (if playing), and Composer */}
            {recorderState === "idle" && (
              <div className="flex items-end w-full gap-2">
                {/* Model Selector and Composer take remaining space */}
                <div className="flex-grow flex flex-col items-center gap-2">
                  <ModelSelectorSheet />
                  <Composer
                    isPlayingAudio={isPlayingAudio}
                    stopAudioPlayback={stopAudioPlayback}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-8 rounded-full disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
        <div className="flex w-full flex-grow flex-col items-center justify-center">
          <p className="mt-4 font-medium">How can I help you today?</p>
          <hr />
          <div className="flex flex-col gap-4 mt-4 bg-white/20 p-4 rounded-lg font-light text-xs tracking-tight">
            <span>
              <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                ⌘
              </kbd>{" "}
              +{" "}
              <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                `
              </kbd>{" "}
              Record audio & process chat
            </span>
            <span>
              <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                ⌥
              </kbd>{" "}
              +{" "}
              <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                `
              </kbd>{" "}
              Show chat window
            </span>
            <span>
              <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                ⌃
              </kbd>{" "}
              +{" "}
              <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                `
              </kbd>{" "}
              Record audio & paste transcription
            </span>
          </div>
        </div>
        {/* <ThreadWelcomeSuggestions /> */}
      </div>
    </ThreadPrimitive.Empty>
  );
};

// const ThreadWelcomeSuggestions: FC = () => {
//   return (
//     <div className="mt-3 flex w-full items-stretch justify-center gap-4">
//       <ThreadPrimitive.Suggestion
//         className="hover:bg-muted/80 flex max-w-sm grow basis-0 flex-col items-center justify-center rounded-lg border p-3 transition-colors ease-in"
//         prompt="What is the weather in Tokyo?"
//         method="replace"
//         autoSend
//       >
//         <span className="line-clamp-2 text-ellipsis text-sm font-semibold">
//           What is the weather in Tokyo?
//         </span>
//       </ThreadPrimitive.Suggestion>
//       <ThreadPrimitive.Suggestion
//         className="hover:bg-muted/80 flex max-w-sm grow basis-0 flex-col items-center justify-center rounded-lg border p-3 transition-colors ease-in"
//         prompt="What is assistant-ui?"
//         method="replace"
//         autoSend
//       >
//         <span className="line-clamp-2 text-ellipsis text-sm font-semibold">
//           What is assistant-ui?
//         </span>
//       </ThreadPrimitive.Suggestion>
//     </div>
//   );
// };

interface ComposerProps {
  isPlayingAudio?: boolean;
  stopAudioPlayback?: () => void;
}

const Composer: FC<ComposerProps> = ({
  isPlayingAudio = false,
  stopAudioPlayback = () => {},
}) => {
  return (
    <ComposerPrimitive.Root className="focus-within:border-ring/20 flex w-full flex-wrap items-end rounded-lg border bg-background/80 px-2.5 shadow-sm transition-colors ease-in">
      <ComposerAttachments />
      <ComposerAddAttachment />
      <ComposerPrimitive.Input
        rows={2}
        autoFocus
        placeholder="Write a message..."
        className="placeholder:text-muted-foreground max-h-40 flex-grow resize-none border-none px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
      />
      {/* Stop Playback Button (Conditional) */}
      {isPlayingAudio && (
        <TooltipIconButton
          tooltip="Stop Playback"
          className="mb-2.5 size-8 p-2 transition-opacity ease-in cursor-pointer"
          onClick={stopAudioPlayback}
          variant={"ghost"}
        >
          <Volume2Icon className="text-blue-800" />
        </TooltipIconButton>
      )}
      <ComposerAction />
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <>
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send"
            variant="default"
            className="my-2.5 size-8 p-2 transition-opacity ease-in"
          >
            <SendHorizontalIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <TooltipIconButton
            tooltip="Cancel"
            variant="default"
            className="my-2.5 size-8 p-2 transition-opacity ease-in"
          >
            <CircleStopIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 [&:where(>*)]:col-start-2 w-full max-w-[var(--thread-max-width)] py-4">
      <UserActionBar />
      <UserMessageAttachments />

      <div className="bg-muted/60 text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words rounded-3xl px-5 py-2.5 col-start-2 row-start-2">
        <MessagePrimitive.Content />
      </div>

      <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex flex-col items-end col-start-1 row-start-2 mr-3 mt-2.5"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="bg-muted my-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 rounded-xl">
      <ComposerPrimitive.Input className="text-foreground flex h-8 w-full resize-none bg-transparent p-4 pb-0 outline-none" />

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost">Cancel</Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button>Send</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

// Define props for AssistantMessage, including the new function
interface AssistantMessageProps {
  playAudioForText?: PlayAudioForTextFn;
}

const AssistantMessage: FC<AssistantMessageProps> = ({
  playAudioForText = async () => {}, // Default async no-op
}) => {
  return (
    <MessagePrimitive.Root className="grid grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] relative w-full max-w-[var(--thread-max-width)] py-4">
      <div className="bg-muted/90 text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words rounded-3xl px-5 py-2.5 pb-4 col-start-2 row-start-2 relative">
        <MessagePrimitive.Content components={{ Text: MarkdownText }} />
        {/* Pass the function down to the action bar */}
        <AssistantActionBar playAudioForText={playAudioForText} />
      </div>

      <BranchPicker className="col-start-2 row-start-2 -ml-2 mr-2" />
    </MessagePrimitive.Root>
  );
};

// Define props for AssistantActionBar
interface AssistantActionBarProps {
  playAudioForText?: PlayAudioForTextFn;
}

const AssistantActionBar: FC<AssistantActionBarProps> = ({
  playAudioForText = async () => {}, // Default async no-op
}) => {
  const message = useMessage(); // Get the current message data

  // Helper to extract text content from the message
  const getMessageText = () => {
    return message.content
      .filter((c) => c.type === "text")
      .map((c) => (c as any).text) // Assuming text content is directly in 'text' property
      .join("\n");
  };

  const handleReadAloudClick = () => {
    const text = getMessageText();
    if (text && playAudioForText) {
      console.log("Read Aloud clicked for message:", message.id);
      playAudioForText(text); // Call the passed function
    } else {
      console.warn(
        "Read Aloud clicked, but no text content found or function missing."
      );
    }
  };

  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="always"
      autohideFloat="single-branch"
      className="text-muted-foreground flex gap-1 absolute -bottom-5 left-0 translate-y-1/2 bg-muted/70 rounded-full py-1 px-2 shadow-sm transition-colors ease-in"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy" className="cursor-pointer">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Re-answer" className="cursor-pointer">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
      {/* Add Read Aloud Button */}
      <TooltipIconButton
        tooltip="Read Aloud"
        onClick={handleReadAloudClick}
        className="cursor-pointer"
      >
        <AudioLinesIcon />
      </TooltipIconButton>
    </ActionBarPrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "text-muted-foreground inline-flex items-center text-xs",
        className
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

const CircleStopIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      width="16"
      height="16"
    >
      <rect width="10" height="10" x="3" y="3" rx="2" />
    </svg>
  );
};
