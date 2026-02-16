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

export function registerAlignmentTools(
  server: McpServer,
  prisma: PrismaClient
) {
  // Tool 8: get_alignments
  server.tool(
    "get_alignments",
    "Get the cross-organizational alignment map showing how goals align across org units.",
    {
      goal_id: z
        .number()
        .optional()
        .describe("Filter alignments involving this goal"),
      alignment_type: z
        .enum(["primary", "secondary", "cross-cutting"])
        .optional()
        .describe("Filter by alignment type"),
    },
    async ({ goal_id, alignment_type }) => {
      try {
        const goalFilter = goal_id
          ? Prisma.sql`AND (child_goal = (SELECT name FROM goal_items WHERE id = ${goal_id}) OR parent_goal = (SELECT name FROM goal_items WHERE id = ${goal_id}))`
          : Prisma.empty;

        const typeFilter = alignment_type
          ? Prisma.sql`AND alignment_type::text = ${alignment_type}`
          : Prisma.empty;

        const results = await prisma.$queryRaw`
          SELECT * FROM v_alignment_map
          WHERE true
          ${goalFilter}
          ${typeFilter}
          ORDER BY parent_goal, child_goal
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
}
