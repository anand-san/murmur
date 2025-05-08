import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigManagerWindow } from "./views/ConfigManager/ConfigManagerWindow";
import "./styles/globals.css"; // Assuming shared styles
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/sonner"; // Adjusted path based on project structure
import { BrowserRouter } from "react-router-dom";

const SettingsRootComponent: React.FC = () => {
  const queryClient = new QueryClient();

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <div className="p-4 bg-background text-foreground">
              <ConfigManagerWindow />
            </div>
            <Toaster />
          </QueryClientProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(
  document.getElementById("settings-root") as HTMLElement
).render(<SettingsRootComponent />);
