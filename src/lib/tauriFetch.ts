import { isTauri } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

let isInitialized = false;

export function initializeTauriFetch() {
  if (isInitialized || !isTauri()) {
    return;
  }

  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const [input, init] = args;
    let url: string;

    if (typeof input === "string") {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else if (input instanceof Request) {
      url = input.url;
    } else {
      url = String(input);
    }

    // Use Tauri's fetch for HTTP/HTTPS requests to external APIs
    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        const headers = new Headers(init?.headers);

        let hasOrigin = false;
        for (const [key] of headers.entries()) {
          if (key.toLowerCase() === "origin") {
            hasOrigin = true;
            break;
          }
        }

        if (!hasOrigin) {
          headers.set("Origin", "tauri://localhost");
        }

        const modifiedInit = {
          ...init,
          headers,
        };

        return await tauriFetch(input, modifiedInit);
      } catch (error) {
        console.error(
          "Tauri fetch failed, falling back to original fetch:",
          error
        );
        return originalFetch(...args);
      }
    }

    // Use original fetch for local resources
    return originalFetch(...args);
  };

  isInitialized = true;

  return () => {
    if (isInitialized) {
      window.fetch = originalFetch;
      isInitialized = false;
    }
  };
}
