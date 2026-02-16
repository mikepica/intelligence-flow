import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PrismaClient } from "@prisma/client";

// Scorecard tool registrations
import { registerGoalTools } from "./tools/goals.js";
import { registerProgressTools } from "./tools/progress.js";
import { registerAlignmentTools } from "./tools/alignment.js";
import { registerScorecardTools } from "./tools/scorecard.js";

// Collaboration tool registrations
import { registerSkillTools } from "./tools/skills.js";
import { registerOutputTools } from "./tools/outputs.js";
import { registerFeedbackTools } from "./tools/feedback.js";

const prisma = new PrismaClient();
const server = new McpServer({
  name: "scorecard-mcp",
  version: "1.0.0",
});

// Register scorecard tools
registerGoalTools(server, prisma);
registerProgressTools(server, prisma);
registerAlignmentTools(server, prisma);
registerScorecardTools(server, prisma);

// Register collaboration tools
registerSkillTools(server, prisma);
registerOutputTools(server, prisma);
registerFeedbackTools(server, prisma);

// Connect via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
