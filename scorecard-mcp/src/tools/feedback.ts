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

export function registerFeedbackTools(
  server: McpServer,
  prisma: PrismaClient
) {
  // Tool 15: request_feedback
  server.tool(
    "request_feedback",
    "Request feedback from another person on a skill output. Creates a pending feedback request.",
    {
      skill_output_id: z
        .number()
        .describe("ID of the skill output to review"),
      requested_by: z
        .string()
        .describe("Person requesting the feedback"),
      requested_from: z
        .string()
        .describe("Person who should provide feedback"),
      request_message: z
        .string()
        .describe("Description of what feedback is needed"),
    },
    async ({ skill_output_id, requested_by, requested_from, request_message }) => {
      try {
        const request = await prisma.feedback_requests.create({
          data: {
            skill_output_id,
            requested_by,
            requested_from,
            request_message,
            status: "pending",
          },
        });

        return {
          content: [
            { type: "text" as const, text: serializeResult(request) },
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

  // Tool 16: get_pending_reviews
  server.tool(
    "get_pending_reviews",
    "Get all pending feedback requests assigned to a specific person. Includes the associated skill output and skill details.",
    {
      person_name: z
        .string()
        .describe("Person to check for pending reviews"),
    },
    async ({ person_name }) => {
      try {
        const reviews = await prisma.feedback_requests.findMany({
          where: {
            requested_from: person_name,
            status: "pending",
          },
          include: {
            skill_outputs: {
              include: {
                skills: true,
              },
            },
          },
          orderBy: { created_at: "asc" },
        });

        return {
          content: [
            { type: "text" as const, text: serializeResult(reviews) },
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

  // Tool 17: submit_feedback
  server.tool(
    "submit_feedback",
    "Submit a feedback response to a pending review request.",
    {
      feedback_request_id: z
        .number()
        .describe("ID of the feedback request to respond to"),
      response_text: z
        .string()
        .describe("The feedback response text"),
    },
    async ({ feedback_request_id, response_text }) => {
      try {
        const updated = await prisma.feedback_requests.update({
          where: { id: feedback_request_id },
          data: {
            status: "completed",
            response_text,
            responded_at: new Date(),
          },
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
