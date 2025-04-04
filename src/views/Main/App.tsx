import { useEffect } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { MainView } from "./MainView";

/**
 * Main App component
 *
 * The primary application interface providing access to recording
 * functionality and application settings.
 */
function App() {
  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "`") {
        console.log("Shortcut detected in React");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="min-h-screen bg-background p-6 flex flex-col items-center justify-start">
      <Card className="border-none">
        <CardContent className="space-y-4">
          <MainView />
        </CardContent>
      </Card>
    </main>
  );
}

export default App;
