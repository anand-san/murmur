import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary"; // Import ErrorBoundary
import { Toaster } from "sonner";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import SidebarContentData from "./components/ui/SidebarContentData";
import { ModelSelectionProvider } from "./views/AiInteraction/context/ModelSelectionContext";
import { BrowserRouter } from "react-router-dom";

const RootComponent = () => {
  const queryClient = new QueryClient();

  return (
    <div className="bg-background/80">
      <ErrorBoundary>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <SidebarProvider defaultOpen={false}>
              <ModelSelectionProvider>
                <SidebarContentData />
                <div className="absolute mt-5 ml-2 left-0 md:left-12 top-0 flex items-center z-40">
                  <SidebarTrigger className="mr-2 text-white hover:text-white bg-stone-500 hover:bg-stone-600 rounded-full p-2 cursor-pointer" />
                </div>
                <App />
                <Toaster />
              </ModelSelectionProvider>
            </SidebarProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </div>
  );
};
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <RootComponent />
);
