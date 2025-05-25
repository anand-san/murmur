import React from "react";
import { Navigate, Outlet } from "react-router-dom";

import { ConversationProvider } from "../contexts/ConversationContext";
import { useAuth } from "@/contexts/AuthContext";
import MurmurLoader from "@/components/ui/MurmurLoader";
import NewSidebar from "@/components/ui/NewSidebar";

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
      <NewSidebar>
        <Outlet />
      </NewSidebar>
    </ConversationProvider>
  );
};

export default AppLayout;
