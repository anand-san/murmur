import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [isVisible, setIsVisible] = useState(true);

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

  // Toggle visibility functions
  const hideApp = async () => {
    try {
      await invoke("hide_window");
      setIsVisible(false);
    } catch (error) {
      console.error("Failed to hide window:", error);
    }
  };

  const showApp = async () => {
    try {
      await invoke("show_window");
      setIsVisible(true);
    } catch (error) {
      console.error("Failed to show window:", error);
    }
  };

  return (
    <main className="container">
      <div style={{ padding: "5px" }}>
        <h3 style={{ textShadow: "0px 0px 5px black, 0px 0px 10px black" }}>
          Transparent Text Only
        </h3>
        <p style={{ textShadow: "0px 0px 5px black, 0px 0px 10px black" }}>
          Press Shift+` to toggle visibility
        </p>
      </div>
    </main>
  );
}

export default App;
