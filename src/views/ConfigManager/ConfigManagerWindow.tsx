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
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Settings,
  Mic,
  MousePointer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Server,
  Wifi,
  WifiOff,
  ExternalLink,
  TestTube,
  RefreshCcw,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

type PermissionStatus = "granted" | "denied" | "unknown" | "checking";
type ConnectionStatus = "connected" | "disconnected" | "testing" | "error";

interface PermissionState {
  microphone: PermissionStatus;
  accessibility: PermissionStatus;
}

interface AudioDevice {
  id: string;
  name: string;
  is_default: boolean;
}

export const ConfigManagerWindow: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    use_local_mode: false,
    backend_url: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [initialBackendUrl, setInitialBackendUrl] = useState<string>("");
  const [permissions, setPermissions] = useState<PermissionState>({
    microphone: "unknown",
    accessibility: "unknown",
  });
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [testingConnection, setTestingConnection] = useState(false);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [loadingAudioDevices, setLoadingAudioDevices] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      const currentSettings = await getAppSettings();
      setSettings(currentSettings);
      setInitialBackendUrl(currentSettings.backend_url || "");
      setIsLoading(false);
    };
    loadSettings();
    checkAllPermissions();
    loadAudioDevices();
  }, []);
  const loadAudioDevices = async () => {
    setLoadingAudioDevices(true);
    try {
      const devices = await invoke<AudioDevice[]>("get_audio_input_devices");
      setAudioDevices(devices);

      // Try to get the currently selected device
      try {
        const selectedDevice = await invoke<string>(
          "get_selected_audio_device"
        );
        setSelectedAudioDevice(selectedDevice);
      } catch (error) {
        console.error("Error getting selected audio device:", error);
        // Default to the default device if available
        const defaultDevice = devices.find((device) => device.is_default);
        if (defaultDevice) {
          setSelectedAudioDevice(defaultDevice.name);
        }
      }
    } catch (error) {
      console.error("Error loading audio devices:", error);
    } finally {
      setLoadingAudioDevices(false);
    }
  };

  const handleAudioDeviceChange = async (deviceName: string) => {
    try {
      await invoke("set_selected_audio_device", { deviceName });
      setSelectedAudioDevice(deviceName);
    } catch (error) {
      console.error("Error setting audio device:", error);
    }
  };

  const checkAllPermissions = async () => {
    await Promise.all([
      checkMicrophonePermission(),
      checkAccessibilityPermission(),
    ]);
  };

  const checkMicrophonePermission = async () => {
    setPermissions((prev) => ({ ...prev, microphone: "checking" }));
    try {
      const status = await invoke<string>("check_microphone_permission");
      setPermissions((prev) => ({
        ...prev,
        microphone: status as PermissionStatus,
      }));
    } catch (error) {
      console.error("Error checking microphone permission:", error);
      setPermissions((prev) => ({ ...prev, microphone: "unknown" }));
    }
  };

  const checkAccessibilityPermission = async () => {
    setPermissions((prev) => ({ ...prev, accessibility: "checking" }));
    try {
      const status = await invoke<string>("check_accessibility_permission");
      setPermissions((prev) => ({
        ...prev,
        accessibility: status as PermissionStatus,
      }));
    } catch (error) {
      console.error("Error checking accessibility permission:", error);
      setPermissions((prev) => ({ ...prev, accessibility: "unknown" }));
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      await invoke<boolean>("request_microphone_permission");
      // Re-check permission after request
      setTimeout(checkMicrophonePermission, 1000);
    } catch (error) {
      console.error("Error requesting microphone permission:", error);
    }
  };

  const requestAccessibilityPermission = async () => {
    try {
      await invoke<boolean>("request_accessibility_permission");
      // Re-check permission after request
      setTimeout(checkAccessibilityPermission, 1000);
    } catch (error) {
      console.error("Error requesting accessibility permission:", error);
    }
  };

  const testBackendConnection = async () => {
    if (!settings.backend_url) return;

    setTestingConnection(true);
    setConnectionStatus("testing");

    try {
      const result = await invoke<string>("test_backend_connection", {
        url: settings.backend_url,
      });
      setConnectionStatus(result === "connected" ? "connected" : "error");
    } catch (error) {
      console.error("Error testing backend connection:", error);
      setConnectionStatus("error");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleLocalModeChange = async (checked: boolean) => {
    setSettings((prev) => ({ ...prev, use_local_mode: checked }));
    await updateUseLocalMode(checked);
  };

  const handleBackendUrlChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings((prev) => ({ ...prev, backend_url: event.target.value }));
    setConnectionStatus("disconnected");
  };

  const handleSaveBackendUrl = async () => {
    if (settings.backend_url) {
      await updateBackendUrl(settings.backend_url);
      setInitialBackendUrl(settings.backend_url);
      // Test connection after saving
      await testBackendConnection();
    }
  };

  const getPermissionIcon = (status: PermissionStatus) => {
    switch (status) {
      case "granted":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "denied":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "checking":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPermissionStatusText = (status: PermissionStatus) => {
    switch (status) {
      case "granted":
        return { text: "Permission granted", color: "text-green-600" };
      case "denied":
        return { text: "Permission denied", color: "text-red-600" };
      case "checking":
        return { text: "Checking permission...", color: "text-blue-600" };
      default:
        return { text: "Permission status unknown", color: "text-yellow-600" };
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="h-5 w-5 text-green-500" />;
      case "testing":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <WifiOff className="h-5 w-5 text-red-500" />;
    }
  };

  const backendUrlChanged = settings.backend_url !== initialBackendUrl;

  if (isLoading) {
    return (
      <div className="p-6 w-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">App System Settings</h1>
          <p className="text-muted-foreground">
            Manage permissions and backend configuration for Murmur
          </p>
        </div>
      </div>

      {/* Permissions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MousePointer className="h-5 w-5" />
            <span>System Permissions</span>
          </CardTitle>
          <CardDescription>
            Required permissions for core app functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Microphone Permission */}
          <div className="flex flex-col justify-between p-4 border rounded-lg">
            <div>
              <div className="flex items-center space-x-3">
                <Mic className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Microphone Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Required to record audio for voice input and AI interaction
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getPermissionIcon(permissions.microphone)}
                  <span
                    className={`text-sm ${
                      getPermissionStatusText(permissions.microphone).color
                    }`}
                  >
                    {getPermissionStatusText(permissions.microphone).text}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {permissions.microphone === "denied" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={requestMicrophonePermission}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Settings
                    </Button>
                  )}
                  {permissions.microphone === "unknown" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={checkMicrophonePermission}
                    >
                      Check
                    </Button>
                  )}
                  {permissions.microphone === "granted" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={checkMicrophonePermission}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4">
              {permissions.microphone === "granted" && (
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between space-x-3">
                    <div>
                      <h4 className="font-medium text-sm">
                        Audio Input Device
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Select which microphone to use for recording
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={loadAudioDevices}
                      disabled={loadingAudioDevices}
                    >
                      {loadingAudioDevices ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    {loadingAudioDevices ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Loading devices...
                        </span>
                      </div>
                    ) : (
                      <Select
                        value={selectedAudioDevice}
                        onValueChange={handleAudioDeviceChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select microphone" />
                        </SelectTrigger>
                        <SelectContent>
                          {audioDevices.map((device) => (
                            <SelectItem key={device.id} value={device.name}>
                              <div className="flex items-center space-x-2">
                                <span>{device.name}</span>
                                {device.is_default && (
                                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Microphone Device Selection */}
          </div>

          {/* Accessibility Permission */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <MousePointer className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Accessibility Access</h3>
                <p className="text-sm text-muted-foreground">
                  Required to paste AI responses directly into text fields on
                  your screen
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {getPermissionIcon(permissions.accessibility)}
                <span
                  className={`text-sm ${
                    getPermissionStatusText(permissions.accessibility).color
                  }`}
                >
                  {getPermissionStatusText(permissions.accessibility).text}
                </span>
              </div>
              <div className="flex space-x-2">
                {permissions.accessibility === "denied" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={requestAccessibilityPermission}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open Settings
                  </Button>
                )}
                {permissions.accessibility === "unknown" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={checkAccessibilityPermission}
                  >
                    Check
                  </Button>
                )}
                {permissions.accessibility === "granted" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={checkAccessibilityPermission}
                  >
                    <TestTube className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Backend Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Backend Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure connection to the Murmur backend service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Local Mode Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div>
                <h3 className="font-medium">Local Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Use a local backend instance instead of remote server
                </p>
              </div>
            </div>
            <Switch
              checked={settings.use_local_mode}
              onCheckedChange={handleLocalModeChange}
            />
          </div>

          {/* Backend URL Configuration */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="backend-url" className="text-base font-medium">
                Backend URL
              </Label>
              <div className="flex items-center space-x-1">
                {getConnectionIcon()}
                <span className="text-sm text-muted-foreground">
                  {connectionStatus === "connected" && "Connected"}
                  {connectionStatus === "testing" && "Testing connection..."}
                  {connectionStatus === "error" && "Connection failed"}
                  {connectionStatus === "disconnected" && "Not tested"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Input
                id="backend-url"
                type="text"
                value={settings.backend_url}
                onChange={handleBackendUrlChange}
                placeholder="e.g., http://localhost:3000/api"
                className="flex-grow"
              />
              <Button
                onClick={handleSaveBackendUrl}
                disabled={!backendUrlChanged}
                variant={backendUrlChanged ? "default" : "outline"}
              >
                Save
              </Button>
              <Button
                onClick={testBackendConnection}
                disabled={!settings.backend_url || testingConnection}
                variant="outline"
                size="default"
              >
                {testingConnection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Enter the full URL of your Murmur backend API endpoint.
              {settings.use_local_mode
                ? " Local mode is enabled - ensure your local server is running."
                : " Make sure the server is accessible from your network."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
