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

export function registerProgressTools(
  server: McpServer,
  prisma: PrismaClient
) {
  // Tool 6: add_progress_update
  server.tool(
    "add_progress_update",
    "Add a versioned progress update to a program. Auto-increments the version number.",
    {
      program_id: z.number().describe("The program (goal_items) ID"),
      update_text: z.string().describe("Progress update narrative"),
      percent_complete: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe("Completion percentage"),
      rag_status: z
        .enum(["Red", "Amber", "Green", "Not Started", "Complete"])
        .optional()
        .describe("RAG status indicator"),
      author: z
        .string()
        .describe("Name of the person authoring this update"),
      metrics: z
        .record(z.unknown())
        .optional()
        .describe("Optional JSON metrics object"),
    },
    async ({ program_id, update_text, percent_complete, rag_status, author, metrics }) => {
      try {
        // Get current max version
        const maxVersionResult = await prisma.$queryRaw<
          Array<{ max_version: number | null }>
        >`
          SELECT COALESCE(MAX(version), 0) AS max_version
          FROM progress_updates
          WHERE program_id = ${program_id}
        `;

        const maxVersion = Number(maxVersionResult[0]?.max_version ?? 0);

        // Map RAG status string to Prisma enum value
        const ragStatusMap: Record<string, string> = {
          "Red": "Red",
          "Amber": "Amber",
          "Green": "Green",
          "Not Started": "Not_Started",
          "Complete": "Complete",
        };

        const result = await prisma.progress_updates.create({
          data: {
            program_id,
            version: maxVersion + 1,
            update_text,
            percent_complete,
            rag_status: rag_status
              ? (ragStatusMap[rag_status] as any)
              : undefined,
            author,
            metrics: (metrics ?? {}) as any,
          },
        });

        return {
          content: [
            { type: "text" as const, text: serializeResult(result) },
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

  // Tool 10: get_latest_progress
  server.tool(
    "get_latest_progress",
    "Get the latest versioned progress update for a program.",
    {
      program_id: z.number().describe("The program (goal_items) ID"),
    },
    async ({ program_id }) => {
      try {
        const results = await prisma.$queryRaw`
          SELECT * FROM v_latest_progress WHERE program_id = ${program_id}
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
