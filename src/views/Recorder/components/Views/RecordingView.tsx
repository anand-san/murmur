import { formatTime } from "../../utils/formatTime";

interface RecordingViewProps {
  recordingDuration: number;
}

export const RecordingView = ({ recordingDuration }: RecordingViewProps) => (
  <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
      <span className="text-sm font-medium">
        Listening... {formatTime(recordingDuration)}
      </span>
    </div>
    <div className="text-center text-muted-foreground">
      Release <kbd className="px-2 py-1 text-xs rounded-md bg-muted">Shift</kbd>{" "}
      + <kbd className="px-2 py-1 text-xs rounded-md bg-muted">`</kbd> to stop
    </div>
  </div>
);
