import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import AppLayout from "../layouts/AppLayout";
import AiInteractionWindow from "../views/AiInteraction";
import ProfileWindow from "../views/Profile/ProfileWindow";
import SettingsWindow from "../views/Settings/SettingsWindow";

const AppRouter: React.FC = () => {
  return (
    <ProtectedRoute>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Default route redirects to new chat */}
          <Route index element={<Navigate to="/chat/new" replace />} />

          {/* Chat routes */}
          <Route path="chat/new" element={<AiInteractionWindow />} />
          <Route path="chat/:id" element={<AiInteractionWindow />} />

          {/* Other routes */}
          <Route path="profile" element={<ProfileWindow />} />
          <Route path="settings" element={<SettingsWindow />} />

          {/* Catch all route - redirect to new chat */}
          <Route path="*" element={<Navigate to="/chat/new" replace />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
};

export default AppRouter;
