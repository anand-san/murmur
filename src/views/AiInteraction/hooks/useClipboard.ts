import { useMutation } from "@tanstack/react-query";
import { performClipboardPaste } from "../api/clipboard";

/**
 * React Query hook for clipboard paste operations
 * @returns A mutation hook for performing clipboard paste operations
 */
export function useClipboardPaste() {
  return useMutation({
    mutationFn: (text: string) => performClipboardPaste(text),
    onError: (error) => {
      console.error("Clipboard operation error:", error);
    },
  });
}
