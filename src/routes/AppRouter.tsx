import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../views/Auth";
import AppLayout from "../layouts/AppLayout";
import AiInteractionWindow from "../views/AiInteraction";
import ProfileWindow from "../views/Profile/ProfileWindow";
import SettingsWindow from "../views/Settings/SettingsWindow";

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/chat/new" replace />} />
        <Route path="chat/new" element={<AiInteractionWindow />} />
        <Route path="chat/:id" element={<AiInteractionWindow />} />
        <Route path="profile" element={<ProfileWindow />} />
        <Route path="settings" element={<SettingsWindow />} />
        <Route path="*" element={<Navigate to="/chat/new" replace />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />{" "}
    </Routes>
  );
};

export default AppRouter;
