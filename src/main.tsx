import React from "react";
import ReactDOM from "react-dom/client";
import WindowManager from "./WindowManager";
import "./global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const RootComponent = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <WindowManager />
    </QueryClientProvider>
  );
};
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
