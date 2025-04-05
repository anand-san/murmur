import { motion } from "framer-motion";

interface ProcessingViewProps {
  processingStatus: string | null;
}

export const ProcessingView = ({ processingStatus }: ProcessingViewProps) => (
  <motion.div
    className="flex flex-col items-center justify-center h-24 gap-2 p-4" // Adjusted height and padding
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    <div className="w-6 h-6 border-4 border-blue-400 border-t-blue-600 rounded-full animate-spin"></div>{" "}
    {/* Adjusted spinner size/color */}
    <div className="text-sm font-medium text-center">
      {processingStatus || "Processing..."}
    </div>
    {/* Removed "Please wait..." for brevity */}
  </motion.div>
);
