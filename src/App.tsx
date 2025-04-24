import { Routes, Route, Navigate } from "react-router-dom";
import AiInteractionWindow from "./views/AiInteraction/AiInteractionWindow";
import { ConfigManagerWindow } from "./views/ConfigManager/ConfigManagerWindow";

export default function App() {
  return (
    <>
      <div className="h-screen w-screen grow bg-background/50">
        <div
          className="absolute top-0 h-7 w-full z-50"
          data-tauri-drag-region
        />
        <Routes>
          <Route index path="/" element={<AiInteractionWindow />} />
          <Route path="/settings" element={<ConfigManagerWindow />} />
          <Route path="*" element={<Navigate to={"/"} />} />
        </Routes>
      </div>
    </>
  );
}
