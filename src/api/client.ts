import { hc } from "hono/client";
import { type ApiRoutes } from "../../backend/core/app";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

const client = hc<ApiRoutes>(baseUrl);

export const api = client;
