import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarTrigger } from "../components/ui/sidebar";
import SidebarContentData from "../components/ui/SidebarContentData";
import { ConversationProvider } from "../contexts/ConversationContext";

const AppLayout: React.FC = () => {
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
