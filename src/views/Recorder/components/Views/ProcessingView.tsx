interface ProcessingViewProps {
  processingStatus: string | null;
}

export const ProcessingView = ({ processingStatus }: ProcessingViewProps) => (
  <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      <div className="text-sm font-medium">
        {processingStatus || "Processing..."}
      </div>
    </div>
    <div className="text-center text-muted-foreground mt-2">Please wait...</div>
  </div>
);
