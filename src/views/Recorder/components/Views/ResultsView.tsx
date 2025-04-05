import { motion } from "framer-motion";
// Removed Button import as it's no longer used
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../../components/ui/accordion"; // Import Accordion components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";

interface ResultsViewProps {
  chatCompletion: string | null;
  transcription: string | null; // Added transcription back
  // Removed unused props: audioUrl, playRecording
}

export const ResultsView = ({
  chatCompletion,
  transcription, // Added transcription back
}: ResultsViewProps) => (
  <motion.div
    className="flex flex-col h-full p-4 gap-3 overflow-y-auto" // Slightly reduced gap
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {/* Animate each card individually */}
    {chatCompletion && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-sm border bg-primary/5">
          {" "}
          {/* Added subtle background */}
          <CardContent className="px-4 py-3 text-sm">
            {" "}
            {/* Adjusted padding */}
            {chatCompletion}
          </CardContent>
        </Card>
      </motion.div>
    )}

    {/* Add Transcription within an Accordion */}
    {transcription && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b-0">
            {" "}
            {/* Remove default border */}
            <AccordionTrigger className="text-xs px-4 py-2 hover:no-underline justify-start gap-1 text-muted-foreground">
              Show Transcription
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3 pt-1">
              {" "}
              {/* Adjust padding */}
              <p className="text-sm text-muted-foreground">{transcription}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </motion.div>
    )}

    {/* REMOVED Play Button Section */}

    {/* Add a message if nothing is displayed (now only checks chatCompletion) */}
    {!chatCompletion && (
      <motion.div
        className="text-center text-sm text-muted-foreground py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Processing complete. No results to display.
      </motion.div>
    )}
  </motion.div>
);
// Removed duplicated code block below
