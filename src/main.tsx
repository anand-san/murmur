import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/components.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary"; // Import ErrorBoundary
import { Toaster } from "react-hot-toast";
import { ModelSelectionProvider } from "./views/AiInteraction/context/ModelSelectionContext";
import { AuthProvider } from "./contexts/AuthContext";
import WindowManager from "./WindowManager";
import { initializeTauriFetch } from "./lib/tauriFetch";

// Initialize Tauri fetch override for proper cookie handling
initializeTauriFetch();

const RootComponent = () => {
  const queryClient = new QueryClient();

  return (
    <div className="bg-background/80">
      <ErrorBoundary>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ModelSelectionProvider>
                <div className="h-screen w-screen grow bg-background/50">
                  <WindowManager />
                </div>
                <Toaster position="top-center" />
              </ModelSelectionProvider>
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </div>
  );
};
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <RootComponent />
);
