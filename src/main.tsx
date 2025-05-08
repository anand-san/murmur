import ReactDOM from "react-dom/client";
import "./styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary"; // Import ErrorBoundary
import { Toaster } from "sonner";
import { SidebarProvider } from "./components/ui/sidebar";
import { ModelSelectionProvider } from "./views/AiInteraction/context/ModelSelectionContext";
import WindowManager from "./WindowManager";

const RootComponent = () => {
  const queryClient = new QueryClient();

  return (
    <div className="bg-background/80">
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SidebarProvider defaultOpen={false}>
            <ModelSelectionProvider>
              <>
                <div
                  className="absolute top-0 h-7 w-full z-50"
                  data-tauri-drag-region
                />
                <div className="h-screen w-screen grow bg-background/50">
                  <WindowManager />
                </div>
              </>
              <Toaster />
            </ModelSelectionProvider>
          </SidebarProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </div>
  );
};
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <RootComponent />
);
