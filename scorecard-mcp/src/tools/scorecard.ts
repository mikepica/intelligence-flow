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

export function registerScorecardTools(
  server: McpServer,
  prisma: PrismaClient
) {
  // Tool 7: get_scorecard
  server.tool(
    "get_scorecard",
    "Get the program scorecard view showing all programs with their quarterly objectives, progress, and RAG status.",
    {
      org_unit_id: z
        .number()
        .optional()
        .describe("Filter to a specific org unit"),
      year: z
        .number()
        .optional()
        .describe("Filter to a specific year (default: 2026)"),
    },
    async ({ org_unit_id }) => {
      try {
        const orgFilter = org_unit_id
          ? Prisma.sql`WHERE org_unit = (SELECT name FROM org_units WHERE id = ${org_unit_id})`
          : Prisma.empty;

        const results = await prisma.$queryRaw`
          SELECT * FROM v_program_scorecard
          ${orgFilter}
          ORDER BY program_name
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

  // Tool 9: get_quarterly_objectives
  server.tool(
    "get_quarterly_objectives",
    "Get the quarterly objectives for a specific program.",
    {
      program_id: z.number().describe("The program (goal_items) ID"),
      year: z
        .number()
        .optional()
        .describe("Filter to a specific year (default: current year)"),
      quarter: z
        .enum(["Q1", "Q2", "Q3", "Q4"])
        .optional()
        .describe("Filter to a specific quarter"),
    },
    async ({ program_id, year, quarter }) => {
      try {
        const objectives = await prisma.program_objectives.findMany({
          where: {
            program_id,
            ...(year && { year }),
            ...(quarter && { quarter }),
          },
          orderBy: [{ year: "asc" }, { quarter: "asc" }],
        });

        return {
          content: [
            { type: "text" as const, text: serializeResult(objectives) },
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
