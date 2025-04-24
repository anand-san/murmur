import ReactDOM from "react-dom/client";
import WindowManager from "./WindowManager";
import "./styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary"; // Import ErrorBoundary
import { Toaster } from "sonner";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import SidebarContentData from "./components/ui/SidebarContentData";
import { ModelSelectionProvider } from "./views/AiInteraction/context/ModelSelectionContext";

const RootComponent = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider defaultOpen={false}>
        <ModelSelectionProvider>
          <SidebarContentData />
          <div className="absolute mt-5 ml-2 left-0 md:left-12 top-0 flex items-center z-40">
            <SidebarTrigger className="mr-2 text-white hover:text-white hover:bg-stone-400 rounded-full p-2 cursor-pointer" />
          </div>
          <div className="flex">
            <WindowManager />
          </div>
          <Toaster />
        </ModelSelectionProvider>
      </SidebarProvider>
    </QueryClientProvider>
  );
};
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // Wrap RootComponent with ErrorBoundary
  <ErrorBoundary>
    <RootComponent />
  </ErrorBoundary>
);
