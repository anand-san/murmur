import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../views/Auth";
import AppLayout from "../layouts/AppLayout";
import AiInteractionWindow from "../views/AiInteraction";
import ProfileWindow from "../views/Profile/ProfileWindow";
import SettingsWindow from "../views/Settings/SettingsWindow";
import AgentsPage from "../views/Agents/AgentsPage";
import CreateAgentPage from "../views/Agents/CreateAgentPage";
import EditAgentPage from "../views/Agents/EditAgentPage";

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/chat/new" replace />} />
        <Route path="chat/new" element={<AiInteractionWindow />} />
        <Route path="chat/:id" element={<AiInteractionWindow />} />
        <Route path="profile" element={<ProfileWindow />} />
        <Route path="settings" element={<SettingsWindow />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="agents/create" element={<CreateAgentPage />} />
        <Route path="agents/edit/:id" element={<EditAgentPage />} />
        <Route path="*" element={<Navigate to="/chat/new" replace />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />{" "}
    </Routes>
  );
};

export default AppRouter;
