import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Settings, ExternalLink, Info } from "lucide-react";

const SettingsWindow: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Application preferences and configuration
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Basic application settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="py-8">
              <p className="text-muted-foreground mb-4">
                General settings will be available here in a future update.
              </p>
              <div className="text-sm text-muted-foreground">
                • Theme preferences
                <br />
                • Language settings
                <br />
                • Notification preferences
                <br />• Default model selection
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Configuration</CardTitle>
            <CardDescription>
              App-specific settings and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                For advanced App permissions and system-level configuration, use
                the dedicated app settings window.
              </p>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  // This would open the Tauri settings window
                  console.log("Opening Tauri settings window...");
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Open Advanced Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsWindow;
