import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAgents } from "../../contexts/AgentsContext";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Plus, Settings, Trash2, Edit, Star, StarOff } from "lucide-react";
import { UserAgent } from "../../api/agents";
import DeleteDialog from "./components/DeleteDialog";

const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    agents,
    defaultAgent,
    isLoading,
    error,
    deleteAgentAction,
    setDefaultAgentAction,
    clearError,
  } = useAgents();

  const [deletingAgent, setDeletingAgent] = useState<UserAgent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateAgent = () => {
    navigate("/agents/create");
  };

  const handleEditAgent = (agent: UserAgent) => {
    navigate(`/agents/edit/${agent.id}`);
  };

  const handleDeleteAgent = async () => {
    if (!deletingAgent) return;

    setIsSubmitting(true);
    try {
      await deleteAgentAction(deletingAgent.id);
      setDeletingAgent(null);
    } catch (error) {
      console.error("Failed to delete agent:", error);
      // Error is handled by the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (agent: UserAgent) => {
    if (agent.isDefault) return;

    try {
      await setDefaultAgentAction(agent);
    } catch (error) {
      console.error("Failed to set default agent:", error);
      // Error is handled by the context
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Agent Management
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage your custom AI agents with different system
              messages
            </p>
          </div>
          <Button
            onClick={handleCreateAgent}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Agent
          </Button>
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
        {agents.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No agents yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first custom agent to get started with personalized AI
              interactions.
            </p>
            <Button
              onClick={handleCreateAgent}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Your First Agent
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id} className="relative gap-0 p-4 px-0">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {agent.name}
                        {agent.isDefault && (
                          <div>
                            <Star className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                      </CardTitle>
                      {agent.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {agent.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-600 line-clamp-3 bg-gray-50 p-2 rounded text-xs overflow-auto min-h-[100px]">
                        {agent.systemMessage}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between mt-2">
                  <div className="flex items-center justify-between text-xs w-full text-gray-500">
                    <span>Created {formatDate(agent.createdAt)}</span>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAgent(agent)}
                        className="h-8 w-8 p-0"
                        title="Edit agent"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingAgent(agent)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                        title="Delete agent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <DeleteDialog
        agent={deletingAgent}
        isOpen={!!deletingAgent}
        onClose={() => setDeletingAgent(null)}
        onConfirm={handleDeleteAgent}
        isDeleting={isSubmitting}
      />
    </div>
  );
};

export default AgentsPage;
