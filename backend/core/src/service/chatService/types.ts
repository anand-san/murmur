import { CoreMessage } from "ai";
import { z } from "zod";

export const ChatMessageSchema = z.object({
  messages: z.array(
    z.custom<CoreMessage>(
      (val) => {
        return (
          typeof val === "object" &&
          val !== null &&
          "role" in val &&
          typeof (val as any).role === "string"
        );
      },
      {
        message: "Must be a valid CoreMessage with at least a role property",
      }
    )
  ),
  system: z.string().optional(),
  tools: z.any().optional(), // Accept any tools format to handle different client implementations
  modelId: z.string().optional(), // Add optional modelId field
});
