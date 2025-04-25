import React, { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import ChatProvidersTab from "./components/ChatProvidersTab";
import VoiceProvidersTab from "./components/VoiceProvidersTab";

export const ConfigManagerWindow: React.FC = () => {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="p-4 pt-12 w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="chat" className="min-w-[150px]">
            Chat
          </TabsTrigger>
          <TabsTrigger value="speech" className="min-w-[150px]">
            Speech
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-0">
          <ChatProvidersTab />
        </TabsContent>

        <TabsContent value="speech" className="mt-0">
          <VoiceProvidersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
