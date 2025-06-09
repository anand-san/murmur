import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getCurrentUser } from "../middleware/authMiddleware";
import { UserAgentsService } from "../service/user/agents";

const createAgentSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  systemMessage: z
    .string()
    .min(1, "System message is required")
    .max(2000, "System message must be less than 2000 characters"),
  isDefault: z.boolean().default(false),
});

const updateAgentSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  systemMessage: z
    .string()
    .min(1, "System message is required")
    .max(2000, "System message must be less than 2000 characters")
    .optional(),
  isDefault: z.boolean().optional(),
});

export const agentsRouter = new Hono()
  .use("/*", authMiddleware)

  .get("/", async (c) => {
    try {
      const user = getCurrentUser(c);
      const agents = await UserAgentsService.getUserAgents(user.id);
      return c.json({
        success: true,
        data: agents,
      });
    } catch (error) {
      console.error("Error fetching agents:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch agents",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  })

  .post("/", zValidator("json", createAgentSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const agentData = c.req.valid("json");

      const nameTaken = await UserAgentsService.isNameTaken(
        user.id,
        agentData.name
      );
      if (nameTaken) {
        return c.json(
          {
            success: false,
            error: "Agent name already exists",
            field: "name",
          },
          400
        );
      }

      const newAgent = await UserAgentsService.createAgent(user.id, agentData);

      return c.json(
        {
          success: true,
          data: newAgent,
          message: "Agent created successfully",
        },
        201
      );
    } catch (error) {
      console.error("Error creating agent:", error);
      return c.json(
        {
          success: false,
          error: "Failed to create agent",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  })

  .put("/:id", zValidator("json", updateAgentSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const agentId = parseInt(c.req.param("id"));
      const agentData = c.req.valid("json");

      if (isNaN(agentId)) {
        return c.json(
          {
            success: false,
            error: "Invalid agent ID",
          },
          400
        );
      }

      const existingAgent = await UserAgentsService.getAgentById(
        user.id,
        agentId
      );
      if (!existingAgent) {
        return c.json(
          {
            success: false,
            error: "Agent not found",
          },
          404
        );
      }

      if (agentData.name) {
        const nameTaken = await UserAgentsService.isNameTaken(
          user.id,
          agentData.name,
          agentId
        );
        if (nameTaken) {
          return c.json(
            {
              success: false,
              error: "Agent name already exists",
              field: "name",
            },
            400
          );
        }
      }

      const updatedAgent = await UserAgentsService.updateAgent(
        user.id,
        agentId,
        agentData
      );

      return c.json({
        success: true,
        data: updatedAgent,
        message: "Agent updated successfully",
      });
    } catch (error) {
      console.error("Error updating agent:", error);
      return c.json(
        {
          success: false,
          error: "Failed to update agent",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  })

  .delete("/:id", async (c) => {
    try {
      const user = getCurrentUser(c);
      const agentId = parseInt(c.req.param("id"));

      if (isNaN(agentId)) {
        return c.json(
          {
            success: false,
            error: "Invalid agent ID",
          },
          400
        );
      }

      const existingAgent = await UserAgentsService.getAgentById(
        user.id,
        agentId
      );
      if (!existingAgent) {
        return c.json(
          {
            success: false,
            error: "Agent not found",
          },
          404
        );
      }

      await UserAgentsService.deleteAgent(user.id, agentId);

      return c.json({
        success: true,
        message: "Agent deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting agent:", error);
      return c.json(
        {
          success: false,
          error: "Failed to delete agent",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  })

  .post("/:id/set-default", async (c) => {
    try {
      const user = getCurrentUser(c);
      const agentId = parseInt(c.req.param("id"));

      if (isNaN(agentId)) {
        return c.json(
          {
            success: false,
            error: "Invalid agent ID",
          },
          400
        );
      }

      const existingAgent = await UserAgentsService.getAgentById(
        user.id,
        agentId
      );
      if (!existingAgent) {
        return c.json(
          {
            success: false,
            error: "Agent not found",
          },
          404
        );
      }

      await UserAgentsService.setDefaultAgent(user.id, agentId);

      return c.json({
        success: true,
        message: "Default agent set successfully",
      });
    } catch (error) {
      console.error("Error setting default agent:", error);
      return c.json(
        {
          success: false,
          error: "Failed to set default agent",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  })

  .get("/default", async (c) => {
    try {
      const user = getCurrentUser(c);
      const defaultAgent = await UserAgentsService.getDefaultAgent(user.id);

      return c.json({
        success: true,
        data: defaultAgent,
      });
    } catch (error) {
      console.error("Error fetching default agent:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch default agent",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  })

  .get("/:id", async (c) => {
    try {
      const user = getCurrentUser(c);
      const agentId = parseInt(c.req.param("id"));

      if (isNaN(agentId)) {
        return c.json(
          {
            success: false,
            error: "Invalid agent ID",
          },
          400
        );
      }

      const agent = await UserAgentsService.getAgentById(user.id, agentId);

      if (!agent) {
        return c.json(
          {
            success: false,
            error: "Agent not found",
          },
          404
        );
      }

      return c.json({
        success: true,
        data: agent,
      });
    } catch (error) {
      console.error("Error fetching agent:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch agent",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  });
