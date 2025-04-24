import { Hono } from "hono";
import { providersConfigRouter } from "./providersConfigRouter";

export const configRouter = new Hono().route(
  "/providers",
  providersConfigRouter
);
