import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { invoke } from "@tauri-apps/api/core";

export const MainView = () => {
  // Toggle visibility functions
  const hideApp = async () => {
    try {
      await invoke("hide_window");
    } catch (error) {
      console.error("Failed to hide window:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-center">
          Welcome to Voice Recorder
        </h2>
        <p className="text-muted-foreground text-sm text-center">
          Quickly capture audio and get AI-powered transcriptions and responses
        </p>
      </div>

      <Card className="p-4 bg-muted/40">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <p className="text-sm font-medium">Quick Start</p>
          </div>

          <ul className="space-y-2 text-sm pl-4">
            <li className="list-item">
              Press{" "}
              <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-background">
                Shift
              </kbd>{" "}
              +{" "}
              <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-background">
                `
              </kbd>{" "}
              to open the recorder
            </li>
            <li className="list-item">
              Hold the same keys to record your voice
            </li>
            <li className="list-item">
              Release to process and transcribe your recording
            </li>
            <li className="list-item">
              Review the AI response and transcription
            </li>
          </ul>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button variant="default" className="w-full" onClick={hideApp}>
          Hide App and Start Recording
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground pt-2">
        Press the same shortcut keys anytime to quickly access the recorder
      </p>
    </div>
  );
};
