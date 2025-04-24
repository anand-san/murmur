import ReactDOM from "react-dom/client";
import WindowManager from "./WindowManager";
import "./styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary"; // Import ErrorBoundary
import { Toaster } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { MessagesSquare } from "lucide-react";
import SidebarContentData from "./components/ui/SidebarContentData";

const RootComponent = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider defaultOpen={false}>
        <Sidebar>
          <SidebarHeader className="flex items-center justify-between">
            <h2 className="text-md font-semibold px-2">Murmur</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarContentData />
          </SidebarContent>
        </Sidebar>
        <div className="absolute mt-6 ml-2 left-0 top-0 flex items-center z-50">
          <SidebarTrigger className="mr-2 text-white hover:text-white bg-stone-950/50 hover:bg-stone-600 rounded-full p-2 cursor-pointer">
            <MessagesSquare className="h-5 w-5" />
          </SidebarTrigger>
        </div>
        <div className="flex">
          <WindowManager />
        </div>
        <Toaster />
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
