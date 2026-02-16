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

export function registerSkillTools(server: McpServer, prisma: PrismaClient) {
  // Tool 11: register_skill
  server.tool(
    "register_skill",
    "Register a new skill for a person. Skills represent capabilities that can produce work outputs.",
    {
      person_name: z.string().describe("The person's name"),
      skill_name: z.string().describe("Name of the skill"),
      skill_type: z
        .enum(["personal", "team"])
        .describe("Whether this is an individual or team skill"),
      description: z
        .string()
        .describe("Description of what this skill does"),
      input_spec: z
        .record(z.unknown())
        .optional()
        .describe("JSON spec of what inputs the skill consumes"),
      output_spec: z
        .record(z.unknown())
        .optional()
        .describe("JSON spec of what outputs the skill produces"),
      metadata: z
        .record(z.unknown())
        .optional()
        .describe("Optional metadata"),
    },
    async ({
      person_name,
      skill_name,
      skill_type,
      description,
      input_spec,
      output_spec,
      metadata,
    }) => {
      try {
        const skill = await prisma.skills.create({
          data: {
            person_name,
            skill_name,
            skill_type,
            description,
            input_spec: (input_spec ?? {}) as any,
            output_spec: (output_spec ?? {}) as any,
            metadata: (metadata ?? {}) as any,
          },
        });

        return {
          content: [
            { type: "text" as const, text: serializeResult(skill) },
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

  // Tool 12: list_skills
  server.tool(
    "list_skills",
    "List all registered skills, optionally filtered by person.",
    {
      person_name: z
        .string()
        .optional()
        .describe("Filter skills by person name"),
    },
    async ({ person_name }) => {
      try {
        const skills = await prisma.skills.findMany({
          where: person_name ? { person_name } : undefined,
          orderBy: { person_name: "asc" },
        });

        return {
          content: [
            { type: "text" as const, text: serializeResult(skills) },
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
