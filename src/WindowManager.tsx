import { useEffect, useState } from "react";
import { getCurrentWindow as tauriWindow } from "@tauri-apps/api/window";
import AiInteractionWindow from "./views/AiInteraction/AiInteractionWindow";
import { ConfigManagerWindow } from "./views/ConfigManager/ConfigManagerWindow";
import { SidebarTrigger } from "./components/ui/sidebar";
import SidebarContentData from "./components/ui/SidebarContentData";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const WindowManager = () => {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);

  useEffect(() => {
    const getWindowLabel = async () => {
      try {
        const label = tauriWindow().label;
        console.log("Window label:", label);
        setWindowLabel(label);
      } catch (error) {
        console.error("Error getting window label:", error);
      }
    };

    getWindowLabel();
  }, []);

  if (windowLabel === null) {
    return <div className="loading">Loading...</div>;
  }

  switch (windowLabel) {
    case "main":
      return (
        <ProtectedRoute>
          <SidebarContentData />
          <div className="absolute mt-5 ml-2 left-0 md:left-12 top-0 flex items-center z-40">
            <SidebarTrigger className="mr-2 text-white hover:text-white bg-stone-500 hover:bg-stone-600 rounded-full p-2 cursor-pointer" />
          </div>
          <AiInteractionWindow />
        </ProtectedRoute>
      );
    case "settings":
      return (
        <ProtectedRoute>
          <ConfigManagerWindow />
        </ProtectedRoute>
      );
    default:
      return <div>Unknown window: {windowLabel}</div>;
  }
};

export default WindowManager;
