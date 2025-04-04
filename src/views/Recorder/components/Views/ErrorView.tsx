import { Card } from "../../../../components/ui/card";

interface ErrorViewProps {
  error: string | null;
}

export const ErrorView = ({ error }: ErrorViewProps) => (
  <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
    <Card className="p-4 border-destructive bg-destructive/5 shadow-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm text-center text-destructive">
          {error || "An unknown error occurred"}
        </div>
      </div>
    </Card>
  </div>
);
