import app from "./app";
import env from "./env";

const server = Bun.serve({
  port: env.PORT,
  hostname: "0.0.0.0",
  fetch: app.fetch,
  idleTimeout: 150,
});

console.log("server running", server.port);
