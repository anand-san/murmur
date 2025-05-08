import React, { useEffect, useState } from "react";
import {
  getAppSettings,
  updateBackendUrl,
  updateUseLocalMode,
  AppSettings,
} from "../../lib/settingsStore";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import { Button } from "../../components/ui/button"; // Assuming you have a Button component

export const ConfigManagerWindow: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    use_local_mode: false,
    backend_url: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [initialBackendUrl, setInitialBackendUrl] = useState<string>("");

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      const currentSettings = await getAppSettings();
      setSettings(currentSettings);
      setInitialBackendUrl(currentSettings.backend_url || "");
      setIsLoading(false);
    };
    loadSettings();
  }, []);

  const handleLocalModeChange = async (checked: boolean) => {
    setSettings((prev) => ({ ...prev, use_local_mode: checked }));
    await updateUseLocalMode(checked);
  };

  const handleBackendUrlChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings((prev) => ({ ...prev, backend_url: event.target.value }));
  };

  const handleSaveBackendUrl = async () => {
    if (settings.backend_url) {
      await updateBackendUrl(settings.backend_url);
      setInitialBackendUrl(settings.backend_url); // Update initial URL after saving
      alert("Backend URL saved!");
    }
  };

  const backendUrlChanged = settings.backend_url !== initialBackendUrl;

  if (isLoading) {
    return <div className="p-4 pt-12 w-full">Loading settings...</div>;
  }

  return (
    <div className="space-y-4 p-4 pt-6 rounded-md">
      <h2 className="text-lg font-medium">Backend Configuration</h2>
      <div className="flex items-center space-x-2">
        <Switch
          id="use-local-mode"
          checked={settings.use_local_mode}
          onCheckedChange={handleLocalModeChange}
        />
        <Label htmlFor="use-local-mode">Use Local Mode</Label>
      </div>
      <p className="text-sm text-muted-foreground">
        When enabled, the application will attempt to use a local backend
        instance.
      </p>

      <div>
        <Label htmlFor="backend-url">Backend URL</Label>
        <div className="flex items-center space-x-2 mt-1">
          <Input
            id="backend-url"
            type="text"
            value={settings.backend_url}
            onChange={handleBackendUrlChange}
            placeholder="e.g., http://localhost:3000/api"
            className="flex-grow"
          />
          <Button onClick={handleSaveBackendUrl} disabled={!backendUrlChanged}>
            Save URL
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          The full URL of your backend API.
        </p>
      </div>
    </div>
  );
};
