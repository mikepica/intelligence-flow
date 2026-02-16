import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

function serializeResult(data: unknown): string {
  return JSON.stringify(
    data,
    (_, value) => (typeof value === "bigint" ? Number(value) : value),
    2
  );
}

export function registerGoalTools(server: McpServer, prisma: PrismaClient) {
  // Tool 1: get_org_tree
  server.tool(
    "get_org_tree",
    "Get the organizational hierarchy tree. Returns nested org units from a root node to a specified depth.",
    {
      root_id: z
        .number()
        .optional()
        .describe("Root org unit ID. Omit for entire tree."),
      depth: z
        .number()
        .optional()
        .describe("Max depth to traverse. Omit for full depth."),
    },
    async ({ root_id, depth }) => {
      try {
        const baseCase = root_id
          ? Prisma.sql`WHERE id = ${root_id}`
          : Prisma.sql`WHERE parent_id IS NULL`;

        const depthFilter =
          depth !== undefined
            ? Prisma.sql`WHERE ot.depth < ${depth}`
            : Prisma.empty;

        const results = await prisma.$queryRaw`
          WITH RECURSIVE org_tree AS (
              SELECT id, parent_id, org_level::text, name, description, owner, status::text, 0 AS depth
              FROM org_units
              ${baseCase}
              UNION ALL
              SELECT ou.id, ou.parent_id, ou.org_level::text, ou.name, ou.description, ou.owner, ou.status::text, ot.depth + 1
              FROM org_units ou
              JOIN org_tree ot ON ou.parent_id = ot.id
              ${depthFilter}
          )
          SELECT * FROM org_tree ORDER BY depth, name;
        `;

        return {
          content: [{ type: "text" as const, text: serializeResult(results) }],
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

  // Tool 2: get_goal_tree
  server.tool(
    "get_goal_tree",
    "Get the goal hierarchy for an org unit. Returns goals from Pillar down to Program level.",
    {
      org_unit_id: z.number().describe("The org unit ID to get goals for"),
      goal_level: z
        .enum(["Pillar", "Category", "Goal", "Program"])
        .optional()
        .describe("Filter to a specific goal level"),
    },
    async ({ org_unit_id, goal_level }) => {
      try {
        const levelFilter = goal_level
          ? Prisma.sql`WHERE goal_level::text = ${goal_level}`
          : Prisma.empty;

        const results = await prisma.$queryRaw`
          WITH RECURSIVE goal_tree AS (
              SELECT id, parent_id, org_unit_id, goal_level::text, name, description, owner, status::text, weight, 0 AS depth
              FROM goal_items
              WHERE org_unit_id = ${org_unit_id}
                AND parent_id IS NULL
              UNION ALL
              SELECT gi.id, gi.parent_id, gi.org_unit_id, gi.goal_level::text, gi.name, gi.description, gi.owner, gi.status::text, gi.weight, gt.depth + 1
              FROM goal_items gi
              JOIN goal_tree gt ON gi.parent_id = gt.id
          )
          SELECT * FROM goal_tree
          ${levelFilter}
          ORDER BY depth, name;
        `;

        return {
          content: [{ type: "text" as const, text: serializeResult(results) }],
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

  // Tool 3: get_goals_for_person
  server.tool(
    "get_goals_for_person",
    "Get all goals owned by a specific person.",
    {
      person_name: z
        .string()
        .describe("The person's name (e.g., 'Dr. Sarah Chen')"),
    },
    async ({ person_name }) => {
      try {
        const goals = await prisma.goal_items.findMany({
          where: { owner: person_name },
          include: {
            org_units: true,
          },
          orderBy: [{ goal_level: "asc" }, { name: "asc" }],
        });

        return {
          content: [
            { type: "text" as const, text: serializeResult(goals) },
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

  // Tool 4: get_goal_details
  server.tool(
    "get_goal_details",
    "Get detailed information about a specific goal, including its children, alignments, and latest progress.",
    {
      goal_id: z.number().describe("The goal item ID"),
    },
    async ({ goal_id }) => {
      try {
        const goal = await prisma.goal_items.findUnique({
          where: { id: goal_id },
          include: { org_units: true },
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

        const children = await prisma.goal_items.findMany({
          where: { parent_id: goal_id },
        });

        const alignmentsAsChild =
          await prisma.goal_alignments.findMany({
            where: { child_goal_id: goal_id },
            include: {
              goal_items_goal_alignments_parent_goal_idTogoal_items: true,
            },
          });

        const alignmentsAsParent =
          await prisma.goal_alignments.findMany({
            where: { parent_goal_id: goal_id },
            include: {
              goal_items_goal_alignments_child_goal_idTogoal_items: true,
            },
          });

        let latestProgress = null;
        if (goal.goal_level === "Program") {
          const progressResults = await prisma.$queryRaw`
            SELECT * FROM v_latest_progress WHERE program_id = ${goal_id}
          `;
          latestProgress = progressResults;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: serializeResult({
                goal,
                children,
                alignments_as_child: alignmentsAsChild,
                alignments_as_parent: alignmentsAsParent,
                latest_progress: latestProgress,
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

  // Tool 5: update_goal_status
  server.tool(
    "update_goal_status",
    "Update the status of a goal.",
    {
      goal_id: z.number().describe("The goal item ID to update"),
      status: z.enum(["Active", "Inactive", "Archived"]).describe("New status"),
    },
    async ({ goal_id, status }) => {
      try {
        const updated = await prisma.goal_items.update({
          where: { id: goal_id },
          data: { status },
        });

        return {
          content: [
            { type: "text" as const, text: serializeResult(updated) },
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
