"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "./assistant-ui/thread";
import { ThreadList } from "./assistant-ui/thread-list";
import { useChat } from "@ai-sdk/react";
import { MutableRefObject, useEffect } from "react";

type SendMessageFn = (text: string) => void;

interface AssistantProps {
  sendMessageRef: MutableRefObject<SendMessageFn | null>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const Assistant = ({ sendMessageRef }: AssistantProps) => {
  const CHAT_API_URL = `${API_BASE}/api/chat`;
  const chat = useChat({ api: CHAT_API_URL });

  const { append } = chat;
  const runtime = useVercelUseChatRuntime(chat);

  useEffect(() => {
    if (sendMessageRef) {
      sendMessageRef.current = (text: string) => {
        append({
          role: "user",
          content: text,
        });
      };
    }

    return () => {
      if (sendMessageRef) {
        sendMessageRef.current = null;
      }
    };
  }, [append, sendMessageRef]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-dvh gap-x-2 px-4 pt-4">
        <ThreadList />
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
};
