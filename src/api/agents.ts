import { api } from "./client";

export interface UserAgent {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  systemMessage: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentData {
  name: string;
  description?: string;
  systemMessage: string;
  isDefault?: boolean;
}

export interface UpdateAgentData {
  name?: string;
  description?: string;
  systemMessage?: string;
  isDefault?: boolean;
}

/**
 * Get all user agents
 */
export async function getUserAgents(): Promise<UserAgent[]> {
  const res = await api.api.agents.$get();

  if (!res.ok) {
    let errorMessage = "Failed to fetch agents";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data.data || [];
}

/**
 * Create a new agent
 */
export async function createAgent(
  agentData: CreateAgentData
): Promise<UserAgent> {
  const res = await api.api.agents.$post({
    json: agentData,
  });

  if (!res.ok) {
    let errorMessage = "Failed to create agent";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
        if ("field" in error && error.field) {
          errorMessage = `${error.field}: ${errorMessage}`;
        }
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data.data;
}

/**
 * Update an existing agent
 */
export async function updateAgent(
  id: number,
  agentData: UpdateAgentData
): Promise<UserAgent> {
  const res = await api.api.agents[":id"].$put({
    param: { id: id.toString() },
    json: agentData,
  });

  if (!res.ok) {
    let errorMessage = "Failed to update agent";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
        if ("field" in error && error.field) {
          errorMessage = `${error.field}: ${errorMessage}`;
        }
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data.data;
}

/**
 * Delete an agent
 */
export async function deleteAgent(id: number): Promise<void> {
  const res = await api.api.agents[":id"].$delete({
    param: { id: id.toString() },
  });

  if (!res.ok) {
    let errorMessage = "Failed to delete agent";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }
}

/**
 * Set an agent as default
 */
export async function setDefaultAgent(id: number): Promise<void> {
  const res = await api.api.agents[":id"]["set-default"].$post({
    param: { id: id.toString() },
  });

  if (!res.ok) {
    let errorMessage = "Failed to set default agent";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }
}

/**
 * Get user's default agent
 */
export async function getDefaultAgent(): Promise<UserAgent | null> {
  const res = await api.api.agents.default.$get();

  if (!res.ok) {
    let errorMessage = "Failed to fetch default agent";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data.data || null;
}

/**
 * Get a specific agent by ID
 */
export async function getAgentById(id: number): Promise<UserAgent> {
  const res = await api.api.agents[":id"].$get({
    param: { id: id.toString() },
  });

  if (!res.ok) {
    let errorMessage = "Failed to fetch agent";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data.data;
}
