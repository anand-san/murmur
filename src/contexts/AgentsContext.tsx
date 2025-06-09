import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  UserAgent,
  CreateAgentData,
  UpdateAgentData,
  getUserAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  getDefaultAgent,
} from "../api/agents";

interface AgentsContextType {
  agents: UserAgent[];
  selectedAgent: UserAgent | null;
  defaultAgent: UserAgent | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createAgentAction: (agentData: CreateAgentData) => Promise<UserAgent>;
  updateAgentAction: (
    id: number,
    agentData: UpdateAgentData
  ) => Promise<UserAgent>;
  deleteAgentAction: (id: number) => Promise<void>;
  setSelectedAgent: (
    agent: UserAgent | null,
    isUserSelection?: boolean
  ) => void;
  setDefaultAgentAction: (agent: UserAgent) => Promise<void>;
  refreshAgents: () => Promise<void>;
  clearError: () => void;
}

const AgentsContext = createContext<AgentsContextType | undefined>(undefined);

export function useAgents() {
  const context = useContext(AgentsContext);
  if (context === undefined) {
    throw new Error("useAgents must be used within an AgentsProvider");
  }
  return context;
}

interface AgentsProviderProps {
  children: React.ReactNode;
}

export function AgentsProvider({ children }: AgentsProviderProps) {
  const [agents, setAgents] = useState<UserAgent[]>([]);
  const [selectedAgent, setSelectedAgentState] = useState<UserAgent | null>(
    null
  );
  const [defaultAgent, setDefaultAgent] = useState<UserAgent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { session } = useAuth();

  const setSelectedAgent = (agent: UserAgent | null) => {
    setSelectedAgentState(agent);
  };

  useEffect(() => {
    if (session?.user) {
      refreshAgents();
      loadDefaultAgent();
    } else {
      setAgents([]);
      setSelectedAgent(null);
      setDefaultAgent(null);
    }
  }, [session?.user]);

  useEffect(() => {
    if (defaultAgent && !selectedAgent && agents.length > 0) {
      setSelectedAgentState(defaultAgent);
    }
  }, [defaultAgent, selectedAgent, agents.length]);

  const loadDefaultAgent = async () => {
    try {
      const defaultAgentData = await getDefaultAgent();
      setDefaultAgent(defaultAgentData);
    } catch (err) {
      console.error("Failed to load default agent:", err);
    }
  };

  const refreshAgents = async () => {
    if (!session?.user) return;

    setIsLoading(true);
    setError(null);

    try {
      const agentsData = await getUserAgents();
      setAgents(agentsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load agents";
      setError(errorMessage);
      console.error("Failed to refresh agents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createAgentAction = async (
    agentData: CreateAgentData
  ): Promise<UserAgent> => {
    setError(null);

    try {
      const newAgent = await createAgent(agentData);

      // Update local state
      setAgents((prev) => [newAgent, ...prev]);

      // If this is the user's first agent or marked as default, set it as default
      if (agentData.isDefault || agents.length === 0) {
        setDefaultAgent(newAgent);
        setSelectedAgent(newAgent);

        // Update other agents to not be default
        setAgents((prev) =>
          prev.map((agent) =>
            agent.id === newAgent.id ? agent : { ...agent, isDefault: false }
          )
        );
      }

      return newAgent;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create agent";
      setError(errorMessage);
      throw err;
    }
  };

  const updateAgentAction = async (
    id: number,
    agentData: UpdateAgentData
  ): Promise<UserAgent> => {
    setError(null);

    try {
      const updatedAgent = await updateAgent(id, agentData);

      // Update local state
      setAgents((prev) =>
        prev.map((agent) => (agent.id === id ? updatedAgent : agent))
      );

      // Update selected agent if it's the one being updated
      if (selectedAgent?.id === id) {
        setSelectedAgent(updatedAgent);
      }

      // Update default agent if it's the one being updated
      if (updatedAgent.isDefault) {
        setDefaultAgent(updatedAgent);

        // Update other agents to not be default
        setAgents((prev) =>
          prev.map((agent) =>
            agent.id === updatedAgent.id
              ? agent
              : { ...agent, isDefault: false }
          )
        );
      } else if (defaultAgent?.id === id && !updatedAgent.isDefault) {
        setDefaultAgent(null);
      }

      return updatedAgent;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update agent";
      setError(errorMessage);
      throw err;
    }
  };

  const deleteAgentAction = async (id: number): Promise<void> => {
    setError(null);

    try {
      await deleteAgent(id);

      // Update local state
      setAgents((prev) => prev.filter((agent) => agent.id !== id));

      // Clear selected agent if it's the one being deleted
      if (selectedAgent?.id === id) {
        setSelectedAgent(null);
      }

      // Clear default agent if it's the one being deleted
      if (defaultAgent?.id === id) {
        setDefaultAgent(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete agent";
      setError(errorMessage);
      throw err;
    }
  };

  const setDefaultAgentAction = async (agent: UserAgent): Promise<void> => {
    setError(null);

    try {
      setDefaultAgent(agent);

      const newDefaultAgent = agents.find((agent) => agent.id === agent.id);
      if (newDefaultAgent) {
        const updatedDefaultAgent = { ...newDefaultAgent, isDefault: true };
        setDefaultAgent(updatedDefaultAgent);
        setSelectedAgent(updatedDefaultAgent);

        setAgents((prev) =>
          prev.map((agent) => ({
            ...agent,
            isDefault: agent.id === agent.id,
          }))
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to set default agent";
      setError(errorMessage);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AgentsContextType = {
    agents,
    selectedAgent,
    defaultAgent,
    isLoading,
    error,
    createAgentAction,
    updateAgentAction,
    deleteAgentAction,
    setSelectedAgent,
    setDefaultAgentAction,
    refreshAgents,
    clearError,
  };

  return (
    <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>
  );
}
