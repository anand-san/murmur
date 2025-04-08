import React from "react";
import ReactDOM from "react-dom/client";
import WindowManager from "./WindowManager";
import "./global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Interface no longer needed here
// interface TranscriptionPayload {
//   text: string;
// }

const RootComponent = () => {
  const queryClient = new QueryClient();
  // currentWindowLabel and useEffect hook related to new_transcription listener are removed

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex">
        <WindowManager />
      </div>
    </QueryClientProvider>
  );
};
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
