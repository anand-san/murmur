import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAgents } from "../../contexts/AgentsContext";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UpdateAgentData } from "../../api/agents";
import AgentForm from "./components/AgentForm";

const EditAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { agents, updateAgentAction, error, clearError } = useAgents();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const agentId = id ? parseInt(id) : null;
  const agent = agentId ? agents.find((a) => a.id === agentId) : null;

  const handleSubmit = async (data: UpdateAgentData) => {
    if (!agentId) return;

    setIsSubmitting(true);
    try {
      await updateAgentAction(agentId, data);
      navigate("/agents", { replace: true });
    } catch (error) {
      console.error("Failed to update agent:", error);
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

  // Redirect if agent not found
  React.useEffect(() => {
    if (agentId && agents.length > 0 && !agent) {
      navigate("/agents", { replace: true });
    }
  }, [agentId, agents.length, agent, navigate]);

  if (!agentId || !agent) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Edit Agent</h1>
            <p className="text-gray-600 mt-1">
              Modify the behavior and personality of "{agent.name}"
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
              initialData={{
                name: agent.name,
                description: agent.description || "",
                systemMessage: agent.systemMessage,
                isDefault: agent.isDefault,
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              isEditing
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAgentPage;
