import { hc } from "hono/client";
import { type ApiRoutes } from "../../backend/core/app";

const baseUrl =
  import.meta.env.VITE_BACKEND_ENDPOINT || "http://localhost:5555";

const client = hc<ApiRoutes>(baseUrl, {
  init: {
    credentials: "include",
  },
});

export const api = client;
