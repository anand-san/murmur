import { CoreMessage } from "ai";
import { ThreadMessageLike } from "@assistant-ui/react";

/**
 * Backend message format as returned by loadChatMessages
 */
export interface BackendMessage {
  id: string;
  content: CoreMessage[];
  createdAt: string;
  updatedAt: string;
  conversationId: string;
}

/**
 * Result of the transformation process
 */
export interface TransformationResult {
  messages: ThreadMessageLike[];
  errors: string[];
  warnings: string[];
}

/**
 * Type guard to check if content is a string
 */
function isStringContent(content: unknown): content is string {
  return typeof content === "string";
}

/**
 * Type guard to check if content is an array
 */
function isArrayContent(content: unknown): content is readonly any[] {
  return Array.isArray(content);
}

/**
 * Generates a unique ID for a ThreadMessageLike based on parent message ID and index
 */
function generateMessageId(parentId: string, index: number): string {
  return `${parentId}-${index}`;
}

/**
 * Safely converts an ISO string to Date, with fallback to current time
 */
function safeParseDate(dateString: string): Date {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateString}, using current time`);
      return new Date();
    }
    return date;
  } catch (error) {
    console.warn(`Failed to parse date: ${dateString}, using current time`);
    return new Date();
  }
}

/**
 * Validates and normalizes a role to ensure it's compatible with ThreadMessageLike
 */
function validateRole(role: string): "assistant" | "user" | "system" {
  const validRoles = ["assistant", "user", "system"] as const;
  if (validRoles.includes(role as any)) {
    return role as "assistant" | "user" | "system";
  }
  console.warn(`Invalid role "${role}", defaulting to "user"`);
  return "user";
}

/**
 * Transforms CoreMessage content to ThreadMessageLike content format
 */
function handleContentTransformation(
  content: string | readonly any[]
): ThreadMessageLike["content"] {
  if (isStringContent(content)) {
    // Convert string content to text content part
    return [{ type: "text", text: content }];
  }

  if (isArrayContent(content)) {
    // Validate and map array content
    return content
      .map((part) => {
        // Basic validation - ensure part has a type
        if (typeof part === "object" && part !== null && "type" in part) {
          return part;
        }

        // If part is a string, convert to text part
        if (typeof part === "string") {
          return { type: "text", text: part };
        }

        // Skip invalid parts
        console.warn("Invalid content part, skipping:", part);
        return null;
      })
      .filter((part): part is NonNullable<typeof part> => part !== null);
  }

  // Fallback for unexpected content types
  console.warn("Unexpected content type, converting to text:", content);
  return [{ type: "text", text: String(content) }];
}

/**
 * Transforms a single CoreMessage to ThreadMessageLike format
 */
function transformCoreMessageToThreadMessage(
  coreMessage: CoreMessage,
  parentId: string,
  index: number,
  timestamp: Date
): ThreadMessageLike {
  const role = validateRole(coreMessage.role);
  const content = handleContentTransformation(coreMessage.content);
  const id = generateMessageId(parentId, index);

  // Create the base message object
  const baseMessage = {
    role,
    content,
    id,
    createdAt: timestamp,
    metadata: {
      custom: {
        originalParentId: parentId,
        originalIndex: index,
      },
    },
  };

  // Add role-specific properties
  if (role === "assistant") {
    return {
      ...baseMessage,
      status: { type: "complete" as const, reason: "stop" as const },
    };
  }

  if (role === "user") {
    return {
      ...baseMessage,
      attachments: [],
    };
  }

  // For system messages, return base message
  return baseMessage;
}

/**
 * Main transformation function: converts backend messages to ThreadMessageLike array
 */
export function transformBackendMessagesToThreadMessages(
  backendMessages: BackendMessage[]
): TransformationResult {
  const messages: ThreadMessageLike[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(backendMessages)) {
    errors.push("Input is not an array of messages");
    return { messages: [], errors, warnings };
  }

  for (const backendMessage of backendMessages) {
    try {
      // Validate backend message structure
      if (!backendMessage || typeof backendMessage !== "object") {
        warnings.push("Skipping invalid message object");
        continue;
      }

      if (!backendMessage.id) {
        warnings.push("Message missing ID, skipping");
        continue;
      }

      if (!Array.isArray(backendMessage.content)) {
        warnings.push(
          `Message ${backendMessage.id} has invalid content, skipping`
        );
        continue;
      }

      // Convert timestamp
      const timestamp = safeParseDate(backendMessage.createdAt);

      // Transform each CoreMessage in the content array
      for (let i = 0; i < backendMessage.content.length; i++) {
        const coreMessage = backendMessage.content[i];

        try {
          // Validate CoreMessage structure
          if (!coreMessage || typeof coreMessage !== "object") {
            warnings.push(
              `Invalid CoreMessage at index ${i} in message ${backendMessage.id}`
            );
            continue;
          }

          if (!coreMessage.role) {
            warnings.push(
              `CoreMessage at index ${i} in message ${backendMessage.id} missing role`
            );
            continue;
          }

          if (
            coreMessage.content === undefined ||
            coreMessage.content === null
          ) {
            warnings.push(
              `CoreMessage at index ${i} in message ${backendMessage.id} missing content`
            );
            continue;
          }

          const threadMessage = transformCoreMessageToThreadMessage(
            coreMessage,
            backendMessage.id,
            i,
            timestamp
          );

          messages.push(threadMessage);
        } catch (error) {
          const errorMsg = `Failed to transform CoreMessage at index ${i} in message ${
            backendMessage.id
          }: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to process backend message ${
        backendMessage?.id || "unknown"
      }: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
    }
  }

  // Log summary
  console.log(
    `Transformed ${backendMessages.length} backend messages to ${messages.length} thread messages`
  );
  if (warnings.length > 0) {
    console.warn(
      `Transformation completed with ${warnings.length} warnings:`,
      warnings
    );
  }
  if (errors.length > 0) {
    console.error(
      `Transformation completed with ${errors.length} errors:`,
      errors
    );
  }

  return { messages, errors, warnings };
}

/**
 * Simplified transformation function that only returns the messages array
 * Use this for most cases where you don't need error/warning details
 */
export function transformBackendMessages(
  backendMessages: BackendMessage[]
): ThreadMessageLike[] {
  const result = transformBackendMessagesToThreadMessages(backendMessages);
  return result.messages;
}

/**
 * Type guard to check if an object is a valid BackendMessage
 */
export function isBackendMessage(obj: unknown): obj is BackendMessage {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "content" in obj &&
    "createdAt" in obj &&
    "updatedAt" in obj &&
    "conversationId" in obj &&
    typeof (obj as any).id === "string" &&
    Array.isArray((obj as any).content) &&
    typeof (obj as any).createdAt === "string" &&
    typeof (obj as any).updatedAt === "string" &&
    typeof (obj as any).conversationId === "string"
  );
}

/**
 * Validates an array of backend messages
 */
export function validateBackendMessages(messages: unknown[]): BackendMessage[] {
  return messages.filter(isBackendMessage);
}
