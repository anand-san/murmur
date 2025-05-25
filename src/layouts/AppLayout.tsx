import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { SidebarTrigger } from "../components/ui/sidebar";
import SidebarContentData from "../components/ui/SidebarContentData";
import { ConversationProvider } from "../contexts/ConversationContext";
import { useAuth } from "@/contexts/AuthContext";
import MurmurLoader from "@/components/ui/MurmurLoader";

const AppLayout: React.FC = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <MurmurLoader />;
  }

  if (!session?.session.id) {
    return <Navigate to="/login" />;
  }

  return (
    <ConversationProvider>
      <SidebarContentData />
      <div className="absolute mt-5 ml-2 left-0 md:left-12 top-0 flex items-center z-40">
        <SidebarTrigger className="mr-2 text-white hover:text-white bg-stone-500 hover:bg-stone-600 rounded-full p-2 cursor-pointer" />
      </div>
      <Outlet />
    </ConversationProvider>
  );
};

export default AppLayout;
