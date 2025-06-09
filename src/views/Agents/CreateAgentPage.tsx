import React from "react";
import { useNavigate } from "react-router-dom";
import { useAgents } from "../../contexts/AgentsContext";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CreateAgentData } from "../../api/agents";
import AgentForm from "./components/AgentForm";

const CreateAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const { createAgentAction, error, clearError } = useAgents();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: CreateAgentData) => {
    setIsSubmitting(true);
    try {
      await createAgentAction(data);
      navigate("/agents", { replace: true });
    } catch (error) {
      console.error("Failed to create agent:", error);
      // Error is handled by the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/agents", { replace: true });
  };

  React.useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
  }, [clearError]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Agents
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Agent
            </h1>
            <p className="text-gray-600 mt-1">
              Define a custom AI agent with specific behavior and personality
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <p className="text-red-800">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border p-6">
            <AgentForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAgentPage;
