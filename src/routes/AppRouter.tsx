import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoginPage, LoadingPage } from "../views/Auth";
import AppLayout from "../layouts/AppLayout";
import AiInteractionWindow from "../views/AiInteraction";
import ProfileWindow from "../views/Profile/ProfileWindow";
import SettingsWindow from "../views/Settings/SettingsWindow";

const AppRouter: React.FC = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

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

      <Route path="/login" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
