import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PrismaClient } from "@prisma/client";

function serializeResult(data: unknown): string {
  return JSON.stringify(
    data,
    (_, value) => (typeof value === "bigint" ? Number(value) : value),
    2
  );
}

export function registerOutputTools(server: McpServer, prisma: PrismaClient) {
  // Tool 13: submit_skill_output
  server.tool(
    "submit_skill_output",
    "Submit the output of executing a skill. Links the output to a specific scorecard goal by name.",
    {
      skill_id: z
        .number()
        .describe("ID of the skill that produced this output"),
      person_name: z
        .string()
        .describe("Name of the person who produced the output"),
      goal_name: z
        .string()
        .describe("Name of the scorecard goal this output advances"),
      output_data: z
        .record(z.unknown())
        .describe("The actual output data as JSON"),
      output_summary: z
        .string()
        .describe("Human-readable summary of the output"),
      metadata: z
        .record(z.unknown())
        .optional()
        .describe("Optional metadata"),
    },
    async ({
      skill_id,
      person_name,
      goal_name,
      output_data,
      output_summary,
      metadata,
    }) => {
      try {
        const output = await prisma.skill_outputs.create({
          data: {
            skill_id,
            person_name,
            goal_name,
            output_data: output_data as any,
            output_summary,
            status: "completed",
            metadata: (metadata ?? {}) as any,
          },
        });

        return {
          content: [
            { type: "text" as const, text: serializeResult(output) },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify({ error: message }) },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool 14: get_skill_outputs
  server.tool(
    "get_skill_outputs",
    "Query skill outputs, optionally filtered by person or goal name.",
    {
      person_name: z
        .string()
        .optional()
        .describe("Filter by person name"),
      goal_name: z
        .string()
        .optional()
        .describe("Filter by scorecard goal name"),
    },
    async ({ person_name, goal_name }) => {
      try {
        const outputs = await prisma.skill_outputs.findMany({
          where: {
            ...(person_name && { person_name }),
            ...(goal_name && { goal_name }),
          },
          include: {
            skills: true,
          },
          orderBy: { created_at: "desc" },
        });

        return {
          content: [
            { type: "text" as const, text: serializeResult(outputs) },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify({ error: message }) },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool 18: get_upstream_outputs
  server.tool(
    "get_upstream_outputs",
    "Get skill outputs from goals that feed into (are upstream of) the specified goal. Uses goal alignment relationships in the database to find upstream dependencies.",
    {
      goal_name: z
        .string()
        .describe("The goal name to find upstream outputs for"),
    },
    async ({ goal_name }) => {
      try {
        // Find the goal by name
        const goal = await prisma.goal_items.findFirst({
          where: { name: goal_name },
        });

        if (!goal) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: "Goal not found" }),
              },
            ],
          };
        }

        // Find upstream goals via alignments (this goal is the child)
        const alignments = await prisma.goal_alignments.findMany({
          where: { child_goal_id: goal.id },
          include: {
            goal_items_goal_alignments_parent_goal_idTogoal_items: true,
          },
        });

        const upstreamGoalNames = alignments.map(
          (a) =>
            a.goal_items_goal_alignments_parent_goal_idTogoal_items.name
        );

        // Also look for sibling outputs under the same parent
        if (goal.parent_id) {
          const siblingPrograms = await prisma.goal_items.findMany({
            where: { parent_id: goal.parent_id, id: { not: goal.id } },
          });
          upstreamGoalNames.push(...siblingPrograms.map((p) => p.name));
        }

        // Query all skill outputs for upstream goals
        const upstreamOutputs =
          upstreamGoalNames.length > 0
            ? await prisma.skill_outputs.findMany({
                where: {
                  goal_name: { in: upstreamGoalNames },
                  status: "completed",
                },
                include: {
                  skills: true,
                },
                orderBy: { created_at: "asc" },
              })
            : [];

        return {
          content: [
            {
              type: "text" as const,
              text: serializeResult({
                goal: goal_name,
                upstream_goals: upstreamGoalNames,
                outputs: upstreamOutputs,
              }),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify({ error: message }) },
          ],
          isError: true,
        };
      }
    }
  );
}
