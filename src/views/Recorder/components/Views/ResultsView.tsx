import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";

interface ResultsViewProps {
  chatCompletion: string | null;
  transcription: string | null;
  audioUrl: string | null;
  playRecording: () => void;
}

export const ResultsView = ({
  chatCompletion,
  transcription,
  audioUrl,
  playRecording,
}: ResultsViewProps) => (
  <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
    {chatCompletion && (
      <Card className="shadow-sm border-none">
        <CardContent className="px-4 py-2 text-sm">
          {chatCompletion}
        </CardContent>
      </Card>
    )}

    {transcription && (
      <Card className="shadow-sm">
        <CardContent className="px-4 py-2 text-sm text-muted-foreground">
          {transcription}
        </CardContent>
      </Card>
    )}

    {audioUrl && (
      <div className="flex justify-center mt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={playRecording}
          className="flex items-center gap-1.5 h-8"
        >
          <span className="text-xs">▶</span> Play Recording
        </Button>
      </div>
    )}
  </div>
);
